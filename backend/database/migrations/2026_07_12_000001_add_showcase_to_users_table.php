<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('showcase_waifu_ids')->nullable()->after('last_energy_regen');
            $table->string('username')->nullable()->unique()->after('name');
        });

        // Seed username from name for existing users
        DB::table('users')->orderBy('id')->each(function ($user) {
            $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $user->name));
            if (empty($base)) $base = 'user';
            $username = $base;
            $counter = 1;
            while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $base . $counter;
                $counter++;
            }
            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['showcase_waifu_ids', 'username']);
        });
    }
};
