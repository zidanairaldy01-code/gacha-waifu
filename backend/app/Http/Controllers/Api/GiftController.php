<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GiftController extends Controller
{
    /**
     * POST /api/gift/send
     * Body: { receiver_username: string, amount: int }
     * - Max 50 gems/hari total yang dikirim sender
     * - Receiver harus ada
     * - Gift masuk sebagai Mail ke receiver
     */
    public function send(Request $request)
    {
        $request->validate([
            'receiver_username' => 'required|string',
            'amount'            => 'required|integer|min:1|max:50',
        ]);

        $sender = $request->user();
        $amount = (int) $request->amount;

        // Cari receiver
        $receiver = User::where('username', $request->receiver_username)->first();
        if (!$receiver) {
            return response()->json(['error' => 'User tujuan tidak ditemukan.'], 404);
        }

        if ($receiver->id === $sender->id) {
            return response()->json(['error' => 'Kamu tidak bisa mengirim gems ke dirimu sendiri.'], 400);
        }

        // Cek total yang sudah dikirim hari ini
        $todayTotal = DB::table('gem_gifts')
            ->where('sender_id', $sender->id)
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');

        if (($todayTotal + $amount) > 50) {
            $remaining = max(0, 50 - $todayTotal);
            return response()->json([
                'error' => "Batas pengiriman harian (50 gems) sudah hampir tercapai. Kamu masih bisa mengirim {$remaining} gems hari ini.",
            ], 400);
        }

        // Cek saldo sender
        if ($sender->gems < $amount) {
            return response()->json(['error' => 'Gems kamu tidak cukup.'], 400);
        }

        // Kurangi gems sender
        $sender->gems -= $amount;
        $sender->save();

        // Catat gift
        DB::table('gem_gifts')->insert([
            'sender_id'   => $sender->id,
            'receiver_id' => $receiver->id,
            'amount'      => $amount,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Kirim mail ke receiver
        Mail::create([
            'user_id'     => $receiver->id,
            'title'       => "💎 Kamu menerima gems dari {$sender->name}!",
            'message'     => "{$sender->name} mengirimkan {$amount} 💎 gems untukmu. Selamat menikmati!",
            'reward_gems' => $amount,
            'is_read'     => false,
            'is_claimed'  => false,
        ]);

        return response()->json([
            'success'        => true,
            'message'        => "Berhasil mengirim {$amount} gems ke {$receiver->name}!",
            'remaining_gems' => $sender->gems,
        ]);
    }
}
