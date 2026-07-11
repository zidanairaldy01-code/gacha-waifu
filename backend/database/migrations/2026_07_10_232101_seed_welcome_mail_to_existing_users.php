<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use App\Models\Mail;

return new class extends Migration
{
    public function up(): void
    {
        $users = User::all();
        foreach ($users as $user) {
            Mail::create([
                'user_id' => $user->id,
                'title' => 'Hadiah Sambutan Developer! 🎉',
                'message' => "Terima kasih telah mencoba Gacha Waifu!\n\nSebagai bentuk apresiasi dari developer, terimalah hadiah 10.000 Gems ini. Gunakan gems ini untuk mendapatkan waifu favoritmu di Stellar Horizon Wish!\n\nSelamat bermain dan semoga beruntung!",
                'reward_gems' => 10000,
            ]);
        }
    }

    public function down(): void
    {
        Mail::where('title', 'Hadiah Sambutan Developer! 🎉')->delete();
    }
};
