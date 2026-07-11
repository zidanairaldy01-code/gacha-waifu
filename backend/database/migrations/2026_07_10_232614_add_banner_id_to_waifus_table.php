<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('waifus', function (Blueprint $table) {
            $table->foreignId('banner_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('waifus', function (Blueprint $table) {
            $table->dropForeign(['banner_id']);
            $table->dropColumn('banner_id');
        });
    }
};
