<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Waifu;
use App\Models\ChatHistory;
use App\Models\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * Resolve chat_token → kembalikan waifu_id milik user yang bersangkutan.
     * Dipakai frontend saat halaman chat pertama kali dimuat.
     */
    public function resolveToken(Request $request, string $token)
    {
        $user = $request->user();

        $pivot = DB::table('user_waifu')
            ->where('user_id', $user->id)
            ->where('chat_token', $token)
            ->first();

        if (!$pivot) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $waifu = Waifu::find($pivot->waifu_id);
        if (!$waifu) {
            return response()->json(['error' => 'Karakter tidak ditemukan.'], 404);
        }

        return response()->json([
            'success'  => true,
            'waifu_id' => $waifu->id,
            'waifu'    => $waifu,
            'affection_level' => $pivot->affection_level,
        ]);
    }

    public function sendMessage(Request $request, string $token)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $user = $request->user();

        // Validasi token kepemilikan
        $pivot = DB::table('user_waifu')
            ->where('user_id', $user->id)
            ->where('chat_token', $token)
            ->first();

        if (!$pivot) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $waifuId = $pivot->waifu_id;
        $waifu   = Waifu::findOrFail($waifuId);

        // Cek Energi
        if ($user->energy < 1) {
            return response()->json(['error' => 'Energi tidak cukup. Tunggu hingga energi terisi kembali.'], 400);
        }

        // Kurangi energi & rekam misi
        $user->energy = max(0, $user->energy - 1);
        if (!$user->last_energy_regen) {
            $user->last_energy_regen = \Carbon\Carbon::now();
        }
        $user->checkQuestsReset();
        $user->quest_chat_count += 1;
        $user->save();

        $userMessage = $request->message;

        // Simpan pesan user ke database
        ChatHistory::create([
            'user_id' => $user->id,
            'waifu_id' => $waifu->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        // Ambil riwayat chat sebelumnya (10 pesan terakhir)
        $history = ChatHistory::where('user_id', $user->id)
            ->where('waifu_id', $waifu->id)
            ->orderBy('created_at', 'asc')
            ->take(10)
            ->get();
            
        // Ambil data affection
        $userWaifu = $user->waifus()->where('waifu_id', $waifuId)->first();
        $affection = $userWaifu ? $userWaifu->pivot->affection_level : 0;
        $affectionPrompt = "";
        if ($affection < 20) {
            $affectionPrompt = "Level keintimanmu dengan {$user->name} saat ini adalah {$affection}/100 (Masih asing/Biasa saja). Bersikaplah natural atau sedikit jaga jarak sesuai kepribadianmu.";
        } elseif ($affection < 50) {
            $affectionPrompt = "Level keintimanmu dengan {$user->name} saat ini adalah {$affection}/100 (Mulai akrab). Bersikaplah lebih ramah, hangat, dan perhatian.";
        } else {
            $affectionPrompt = "Level keintimanmu dengan {$user->name} saat ini adalah {$affection}/100 (Sangat intim/Jatuh cinta). Bersikaplah sangat romantis, manja, penuh cinta, dan panggil {$user->name} dengan sebutan sayang.";
        }

        // Bangun array messages untuk AI
        $messages = [];

        // System prompt: karakter waifu + instruksi bahasa + ekspresi emot + affection
        $systemPrompt = $waifu->base_prompt
            . "\n\n" . $affectionPrompt
            . "\n\nPenting: Selalu balas dalam Bahasa Indonesia. Gunakan gaya bicara sesuai kepribadianmu."
            . " Nama pengguna yang mengajakmu bicara adalah: {$user->name}."
            . "\n\nGunakan emotikon teks anime untuk mengekspresikan perasaanmu, misalnya:"
            . "\n- Senang/Gembira: (≧◡≦) / (*´▽`*) / \\(^o^)/"
            . "\n- Malu/Tersipu: (///▽///) / (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) / (*//ω//*)"  
            . "\n- Sedih/Kecewa: (｡•́︿•̀｡) / ( ﾟ，ﾟ) / (；ω；)"
            . "\n- Marah/Kesal: (╯°□°）╯ / (；一_一) / （`ε´）"
            . "\n- Bingung/Heran: (・・?) / (｀・ω・´)? / (?_?)"
            . "\n- Manja/Imut: (◕‿◕✿) / (｡♥‿♥｡) / (づ ◕‿◕ )づ"
            . "\nSisipkan emotikon di tempat yang tepat agar terasa natural dan ekspresif.";

        $messages[] = ['role' => 'system', 'content' => $systemPrompt];

        // Masukkan riwayat
        foreach ($history as $chat) {
            $messages[] = ['role' => $chat->role, 'content' => $chat->content];
        }

        // ─── Coba Groq API dulu ────────────────────────────────
        $groqKey = env('GROQ_API_KEY');
        $aiReply = null;

        if ($groqKey) {
            try {
                $response = Http::timeout(30)
                    ->withHeaders([
                        'Authorization' => "Bearer {$groqKey}",
                        'Content-Type'  => 'application/json',
                    ])
                    ->post('https://api.groq.com/openai/v1/chat/completions', [
                        'model'    => 'llama-3.1-8b-instant', // Model gratis di Groq
                        'messages' => $messages,
                        'max_tokens' => 300,
                        'temperature' => 0.85,
                    ]);

                if ($response->successful()) {
                    $aiReply = $response->json('choices.0.message.content');
                }
            } catch (\Exception $e) {
                // Lanjut ke fallback
            }
        }

        // ─── Fallback ke Ollama jika Groq tidak dikonfigurasi ──
        if (!$aiReply) {
            try {
                $response = Http::timeout(30)->post('http://localhost:11434/api/chat', [
                    'model'   => 'llama3',
                    'messages' => $messages,
                    'stream'  => false,
                ]);

                if ($response->successful()) {
                    $aiReply = $response->json('message.content');
                }
            } catch (\Exception $e) {
                // Fallback terakhir
            }
        }

        // ─── Fallback Rule-Based jika semua API offline ─────────
        if (!$aiReply) {
            $aiReply = $this->fallbackReply($waifu->name, $waifu->rarity);
        }

        // Simpan balasan AI ke database
        ChatHistory::create([
            'user_id' => $user->id,
            'waifu_id' => $waifu->id,
            'role' => 'assistant',
            'content' => $aiReply,
        ]);

        // ─── Naikkan Affection setelah chat ─────────────────────
        $oldAffection = $pivot->affection_level ?? 0;
        $newAffection = min(100, $oldAffection + 1);
        DB::table('user_waifu')
            ->where('user_id', $user->id)
            ->where('waifu_id', $waifuId)
            ->update(['affection_level' => $newAffection]);

        // ─── Cek & Kirim Affection Milestone Rewards ─────────────
        $this->checkAffectionRewards($user, $waifuId, $waifu->name, $oldAffection, $newAffection);

        return response()->json([
            'success' => true,
            'message' => $aiReply,
            'remaining_energy' => $user->energy,
            'affection_level' => $newAffection,
            'ai_provider' => $groqKey ? 'groq' : 'offline',
        ]);
    }

    /**
     * Cek milestone affection dan kirim reward mail jika belum diklaim.
     */
    private function checkAffectionRewards($user, int $waifuId, string $waifuName, int $oldLevel, int $newLevel): void
    {
        $milestones = [
            25 => ['gems' => 50,  'tickets' => 1, 'special' => false],
            50 => ['gems' => 100, 'tickets' => 0, 'special' => true],
            75 => ['gems' => 150, 'tickets' => 2, 'special' => false],
            100 => ['gems' => 300, 'tickets' => 3, 'special' => false],
        ];

        foreach ($milestones as $milestone => $reward) {
            // Milestone dilewati jika affection baru >= milestone dan lama < milestone
            if ($newLevel >= $milestone && $oldLevel < $milestone) {
                // Cek apakah sudah pernah diklaim
                $alreadyClaimed = DB::table('affection_rewards')
                    ->where('user_id', $user->id)
                    ->where('waifu_id', $waifuId)
                    ->where('milestone', $milestone)
                    ->exists();

                if (!$alreadyClaimed) {
                    // Tandai sudah diklaim
                    DB::table('affection_rewards')->insert([
                        'user_id'    => $user->id,
                        'waifu_id'   => $waifuId,
                        'milestone'  => $milestone,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Buat isi pesan
                    $rewardDesc = [];
                    if ($reward['gems'] > 0) $rewardDesc[] = "{$reward['gems']} 💎 Gems";
                    if ($reward['tickets'] > 0) $rewardDesc[] = "{$reward['tickets']} 🎫 Tiket";
                    $rewardStr = implode(' + ', $rewardDesc);

                    $message = "Selamat! Affection dengan {$waifuName} telah mencapai level {$milestone}! "
                        . "Kamu mendapatkan {$rewardStr} sebagai hadiah kesetiaan.";

                    if ($reward['special']) {
                        $message .= " {$waifuName} punya dialog spesial untukmu! Pergi chat sekarang~";
                    }

                    Mail::create([
                        'user_id'          => $user->id,
                        'title'            => "💖 Hadiah Affection Lv.{$milestone} — {$waifuName}",
                        'message'          => $message,
                        'reward_gems'      => $reward['gems'],
                        'reward_tickets'   => $reward['tickets'],
                        'is_special_dialog' => $reward['special'],
                        'is_read'          => false,
                        'is_claimed'       => false,
                    ]);
                }
            }
        }
    }

    /**
     * Fallback response berbasis aturan sederhana jika semua AI offline.
     */
    private function fallbackReply(string $name, string $rarity): string
    {
        $replies = [
            'SSR' => [
                "...Kehadiranmu terasa seperti angin malam (｡•̀ᵕ-)✧ Ada yang ingin kamu ceritakan?",
                "Hmm... (・・?) Aku sedang merenungkan sesuatu. Apa yang membuatmu datang padaku hari ini?",
                "Aku mendengarmu ♪(´▽`) Teruslah berbicara, aku di sini...",
                "*menatap dengan tenang* ...kamu terasa berbeda hari ini (＊˘︶˘＊) Ada apa?",
            ],
            'SR' => [
                "Hah?! (╯°□°）╯ J-jangan salah paham ya! Aku hanya kebetulan ada di sini!",
                "B-bodoh! （`ε´） Memangnya kamu pikir aku senang kamu mengajakku ngobrol?! ...T-tapi... boleh sih (///▽///)",
                "Kamu lagi ngapain sih?! (；一_一) ...Eh, maksudku... ada apa? *memalingkan wajah*",
                "Hm! (╬ Ò ‸ Ó) Aku tidak menunggu kamu tahu! ...Tapi senang kamu datang (⁄ ⁄•⁄ω⁄•⁄ ⁄)",
            ],
            'R' => [
                "Goshujin-sama~! \\(^o^)/ Ada yang bisa aku bantu? Aku siap melayani kapanpun! ✨",
                "Sugoi~! (*´▽`*) Kamu datang ngobrol sama aku? Senang sekali desu~!",
                "Hehe (◕‿◕✿) Ada apa Goshujin-sama? Aku siap mendengarkan apa saja~",
                "Yay~! (≧◡≦) Aku senang sekali kamu mau ngajak aku ngobrol!",
            ],
        ];

        $pool = $replies[$rarity] ?? $replies['R'];
        return $pool[array_rand($pool)];
    }

    public function getHistory(Request $request, string $token)
    {
        $user = $request->user();

        // Validasi token kepemilikan
        $pivot = DB::table('user_waifu')
            ->where('user_id', $user->id)
            ->where('chat_token', $token)
            ->first();

        if (!$pivot) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $history = ChatHistory::where('user_id', $user->id)
            ->where('waifu_id', $pivot->waifu_id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}
