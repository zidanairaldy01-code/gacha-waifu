<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RewardController extends Controller
{
    public function claimDaily(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();

        if ($user->last_claim_date === $today) {
            return response()->json([
                'error' => 'Anda sudah mengklaim hadiah hari ini.'
            ], 400);
        }

        // Beri hadiah: 160 Gems, 10 Energy (max 100), 1 Ticket
        $user->gems += 160;
        $user->energy = min(100, $user->energy + 10);
        $user->tickets += 1;
        $user->last_claim_date = $today;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Klaim harian berhasil! +160 Gems, +10 Energi, +1 Tiket Gacha',
            'gems' => $user->gems,
            'energy' => $user->energy,
            'tickets' => $user->tickets,
            'last_claim_date' => $user->last_claim_date
        ]);
    }
}
