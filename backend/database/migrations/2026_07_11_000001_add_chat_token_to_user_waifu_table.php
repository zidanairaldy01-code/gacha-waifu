<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_waifu', function (Blueprint $table) {
            $table->uuid('chat_token')->nullable()->unique()->after('waifu_id');
        });

        // Isi chat_token untuk record yang sudah ada
        DB::table('user_waifu')->whereNull('chat_token')->get()->each(function ($row) {
            DB::table('user_waifu')
                ->where('id', $row->id)
                ->update(['chat_token' => Str::uuid()]);
        });

        // Setelah diisi, jadikan NOT NULL
        Schema::table('user_waifu', function (Blueprint $table) {
            $table->uuid('chat_token')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('user_waifu', function (Blueprint $table) {
            $table->dropColumn('chat_token');
        });
    }
};
