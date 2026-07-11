<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GachaController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\QuestController;
use App\Http\Controllers\Api\MailController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\TopUpController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\GiftController;
use App\Models\Waifu;

// ─── Public Routes (No Auth) ─────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Lihat semua waifu pool (publik)
Route::get('/waifus', function () {
    return response()->json(Waifu::all());
});

// Lihat semua banner aktif (publik)
Route::get('/banners', [BannerController::class, 'getActiveBanners']);

// Detail satu waifu (publik, untuk header chat)
Route::get('/waifus/{id}', function ($id) {
    $waifu = Waifu::findOrFail($id);
    return response()->json($waifu);
});

// Profil publik
Route::get('/profile/{username}', [ProfileController::class, 'show']);

// ─── Protected Routes (Auth: Sanctum Token) ──────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Inventory user (daftar waifu yang dimiliki)
    Route::get('/inventory', function (Request $request) {
        $waifus = $request->user()->waifus()->withPivot('affection_level', 'level', 'chat_token')->get();
        return response()->json($waifus);
    });

    // Gacha pull
    Route::post('/gacha/pull', [GachaController::class, 'pull']);
    Route::post('/gacha/pull-ten', [GachaController::class, 'pullTen']);

    // Klaim Hadiah Harian
    Route::post('/claim-daily', [RewardController::class, 'claimDaily']);

    // Misi Harian
    Route::get('/quests', [QuestController::class, 'getQuests']);
    Route::post('/quests/claim', [QuestController::class, 'claimQuest']);

    // Chat AI
    Route::get('/chat/resolve/{token}', [ChatController::class, 'resolveToken']);
    Route::post('/chat/{token}', [ChatController::class, 'sendMessage']);
    Route::get('/chat/{token}/history', [ChatController::class, 'getHistory']);

    // Mail System
    Route::get('/mails', [MailController::class, 'getMails']);
    Route::post('/mails/{id}/claim', [MailController::class, 'claimMail']);

    // Top Up
    Route::post('/topup', [TopUpController::class, 'processTopUp']);

    // Profil Showcase (update)
    Route::put('/profile/showcase', [ProfileController::class, 'updateShowcase']);

    // Gift / Kirim Gems
    Route::post('/gift/send', [GiftController::class, 'send']);
});
