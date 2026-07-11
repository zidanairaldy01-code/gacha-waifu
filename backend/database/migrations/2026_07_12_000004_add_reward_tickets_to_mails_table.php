<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mails', function (Blueprint $table) {
            $table->integer('reward_tickets')->default(0)->after('reward_gems');
            $table->boolean('is_special_dialog')->default(false)->after('reward_tickets');
        });
    }

    public function down(): void
    {
        Schema::table('mails', function (Blueprint $table) {
            $table->dropColumn(['reward_tickets', 'is_special_dialog']);
        });
    }
};
