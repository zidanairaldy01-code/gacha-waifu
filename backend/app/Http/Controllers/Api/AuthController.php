<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Mail;
use App\Models\GachaLog;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Generate username unik dari nama
        $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $request->name));
        if (empty($base)) $base = 'user';
        $username = $base;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        $user = User::create([
            'name'     => $request->name,
            'username' => $username,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'gems'     => 1600,
            'energy'   => 100,
        ]);

        // Berikan surat selamat datang
        Mail::create([
            'user_id' => $user->id,
            'title' => 'Hadiah Sambutan Developer! 🎉',
            'message' => "Terima kasih telah mencoba Gacha Waifu!\n\nSebagai bentuk apresiasi dari developer, terimalah hadiah 10.000 Gems ini. Gunakan gems ini untuk mendapatkan waifu favoritmu di Stellar Horizon Wish!\n\nSelamat bermain dan semoga beruntung!",
            'reward_gems' => 10000,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'gems' => $user->gems,
                'energy' => $user->energy,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Email atau password salah.'], 401);
        }

        // Hapus token lama
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'gems' => $user->gems,
                'energy' => $user->energy,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->applyEnergyRegen(); // Hitung & tambahkan energi yang sudah terkumpul

        // Hitung Pity Counter
        $lastSSRPull = GachaLog::where('user_id', $user->id)
            ->whereHas('waifu', function($q) {
                $q->where('rarity', 'SSR');
            })->orderBy('created_at', 'desc')->first();

        if ($lastSSRPull) {
            $pullsSinceSSR = GachaLog::where('user_id', $user->id)
                ->where('created_at', '>', $lastSSRPull->created_at)
                ->count();
        } else {
            $pullsSinceSSR = GachaLog::where('user_id', $user->id)->count();
        }
        
        $pullsUntilPity = 50 - ($pullsSinceSSR % 50);

        $unreadMailCount = $user->mails()->where('is_read', false)->count();

        return response()->json([
            'id'               => $user->id,
            'name'             => $user->name,
            'username'         => $user->username,
            'email'            => $user->email,
            'gems'             => $user->gems,
            'energy'           => $user->energy,
            'tickets'          => $user->tickets,
            'last_claim_date'  => $user->last_claim_date,
            'last_energy_regen'=> $user->last_energy_regen,
            'pulls_until_pity' => $pullsUntilPity,
            'unread_mail_count'=> $unreadMailCount,
            'showcase_waifu_ids' => $user->showcase_waifu_ids ?? [],
        ]);
    }
}
