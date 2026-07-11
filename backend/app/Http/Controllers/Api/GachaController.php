<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Waifu;
use App\Models\GachaLog;
use Illuminate\Support\Str;

class GachaController extends Controller
{
    /**
     * Shared logic: determine rarity for a single pull given current pity counter.
     * Returns ['rarity' => string, 'is_pity' => bool, 'new_pulls_since_ssr' => int]
     */
    private function determineRarity(int $pullsSinceSSR): array
    {
        $isPity = false;
        if (($pullsSinceSSR + 1) >= 50) {
            $rarity = 'SSR';
            $isPity = true;
        } else {
            $rand = mt_rand(1, 100);
            if ($rand <= 5) {
                $rarity = 'SSR';
            } elseif ($rand <= 30) {
                $rarity = 'SR';
            } else {
                $rarity = 'R';
            }
        }
        return ['rarity' => $rarity, 'is_pity' => $isPity];
    }

    /**
     * Shared logic: attach or update waifu for user, returns [waifu, isDuplicate, chatToken]
     */
    private function attachWaifu($user, $waifu): array
    {
        $existing = $user->waifus()->where('waifu_id', $waifu->id)->first();
        if ($existing) {
            $user->waifus()->updateExistingPivot($waifu->id, [
                'affection_level' => $existing->pivot->affection_level + 10
            ]);
            $isDuplicate = true;
        } else {
            $user->waifus()->attach($waifu->id, [
                'affection_level' => 0,
                'level'          => 1,
                'chat_token'     => (string) Str::uuid(),
            ]);
            $isDuplicate = false;
        }
        $userWaifu = $user->waifus()->where('waifu_id', $waifu->id)->first();
        $chatToken = $userWaifu ? $userWaifu->pivot->chat_token : null;
        return [$isDuplicate, $chatToken];
    }

    public function pull(Request $request)
    {
        $user = $request->user();
        $bannerId = $request->input('banner_id', 1);

        // Cek tiket atau saldo gem (Cost: 1 Ticket atau 160 Gems)
        if ($user->tickets > 0) {
            $user->tickets -= 1;
        } elseif ($user->gems >= 160) {
            $user->gems -= 160;
        } else {
            return response()->json(['error' => 'Gems atau Tiket tidak cukup'], 400);
        }

        $user->checkQuestsReset();
        $user->quest_gacha_count += 1;
        $user->save();

        // Hitung pity
        $pullsSinceSSR = $this->getPullsSinceSSR($user);
        $isPity = false;

        ['rarity' => $rarity, 'is_pity' => $isPity] = $this->determineRarity($pullsSinceSSR);

        // Ambil Waifu Acak berdasarkan Rarity dan Banner
        $waifu = Waifu::where('rarity', $rarity)
                      ->where('banner_id', $bannerId)
                      ->inRandomOrder()
                      ->first();

        if (!$waifu) {
            return response()->json(['error' => 'Banner tidak valid atau tidak memiliki karakter dengan rarity ' . $rarity], 400);
        }

        [$isDuplicate, $chatToken] = $this->attachWaifu($user, $waifu);

        // Catat ke Gacha Log
        GachaLog::create([
            'user_id'     => $user->id,
            'waifu_id'    => $waifu->id,
            'pull_number' => $pullsSinceSSR + 1,
            'is_pity'     => $isPity,
        ]);

        // Hitung ulang pulls_until_pity setelah pull ini
        $newPullsUntilPity = 50 - (($pullsSinceSSR + 1) % 50);

        return response()->json([
            'success'           => true,
            'waifu'             => $waifu,
            'chat_token'        => $chatToken,
            'is_pity'           => $isPity,
            'is_duplicate'      => $isDuplicate,
            'remaining_gems'    => $user->gems,
            'remaining_tickets' => $user->tickets,
            'pulls_until_pity'  => $newPullsUntilPity,
        ]);
    }

    public function pullTen(Request $request)
    {
        $user = $request->user();
        $bannerId = $request->input('banner_id', 1);

        // Cek biaya: 10 tiket ATAU 1500 gems
        if ($user->tickets >= 10) {
            $user->tickets -= 10;
        } elseif ($user->gems >= 1500) {
            $user->gems -= 1500;
        } else {
            return response()->json(['error' => 'Butuh 10 Tiket atau 1500 Gems untuk 10x Pull'], 400);
        }

        $user->checkQuestsReset();
        $user->quest_gacha_count += 10;
        $user->save();

        $results = [];
        $hasSRorSSR = false;
        $pullsSinceSSR = $this->getPullsSinceSSR($user);

        for ($i = 0; $i < 10; $i++) {
            ['rarity' => $rarity, 'is_pity' => $isPity] = $this->determineRarity($pullsSinceSSR);

            // Jaminan minimal 1 SR/SSR: jika ini pull ke-10 dan belum ada SR/SSR, paksa SR
            if ($i === 9 && !$hasSRorSSR && $rarity === 'R') {
                $rarity = 'SR';
                $isPity = false;
            }

            $waifu = Waifu::where('rarity', $rarity)
                          ->where('banner_id', $bannerId)
                          ->inRandomOrder()
                          ->first();

            // Fallback: cari dari banner lain atau rarity manapun
            if (!$waifu) {
                $waifu = Waifu::where('rarity', $rarity)->inRandomOrder()->first();
            }
            if (!$waifu) {
                continue;
            }

            [$isDuplicate, $chatToken] = $this->attachWaifu($user, $waifu);

            GachaLog::create([
                'user_id'     => $user->id,
                'waifu_id'    => $waifu->id,
                'pull_number' => $pullsSinceSSR + 1,
                'is_pity'     => $isPity,
            ]);

            if ($rarity === 'SSR') {
                $hasSRorSSR = true;
                $pullsSinceSSR = 0; // reset pity setelah dapat SSR
            } elseif ($rarity === 'SR') {
                $hasSRorSSR = true;
                $pullsSinceSSR++;
            } else {
                $pullsSinceSSR++;
            }

            $results[] = [
                'waifu'        => $waifu,
                'chat_token'   => $chatToken,
                'is_pity'      => $isPity,
                'is_duplicate' => $isDuplicate,
            ];
        }

        // Hitung pulls_until_pity terkini
        $newPullsUntilPity = max(1, 50 - ($pullsSinceSSR % 50));

        return response()->json([
            'success'           => true,
            'results'           => $results,
            'remaining_gems'    => $user->gems,
            'remaining_tickets' => $user->tickets,
            'pulls_until_pity'  => $newPullsUntilPity,
        ]);
    }

    /**
     * Hitung berapa pull sejak SSR terakhir.
     */
    private function getPullsSinceSSR($user): int
    {
        $lastSSRPull = GachaLog::where('user_id', $user->id)
            ->whereHas('waifu', function ($q) {
                $q->where('rarity', 'SSR');
            })->orderBy('created_at', 'desc')->first();

        if ($lastSSRPull) {
            return GachaLog::where('user_id', $user->id)
                ->where('created_at', '>', $lastSSRPull->created_at)
                ->count();
        }
        return GachaLog::where('user_id', $user->id)->count();
    }
}
