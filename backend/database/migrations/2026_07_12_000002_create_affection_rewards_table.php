<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affection_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('waifu_id')->constrained()->cascadeOnDelete();
            $table->integer('milestone'); // 25, 50, 75, 100
            $table->timestamps();

            $table->unique(['user_id', 'waifu_id', 'milestone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affection_rewards');
    }
};
