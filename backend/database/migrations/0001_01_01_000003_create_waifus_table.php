<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waifus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('rarity', ['R', 'SR', 'SSR']);
            $table->text('description')->nullable();
            $table->text('base_prompt')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waifus');
    }
};
