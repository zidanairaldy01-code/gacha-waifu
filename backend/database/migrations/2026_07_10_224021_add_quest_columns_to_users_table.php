<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('quest_date')->nullable();
            $table->integer('quest_gacha_count')->default(0);
            $table->integer('quest_chat_count')->default(0);
            $table->boolean('quest_gacha_claimed')->default(false);
            $table->boolean('quest_chat_claimed')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'quest_date', 
                'quest_gacha_count', 
                'quest_chat_count', 
                'quest_gacha_claimed', 
                'quest_chat_claimed'
            ]);
        });
    }
};
