<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class QuestController extends Controller
{
    public function getQuests(Request $request)
    {
        $user = $request->user();
        $user->checkQuestsReset(); // Pastikan state up to date

        return response()->json([
            'success' => true,
            'quests' => [
                [
                    'id' => 'gacha',
                    'title' => 'Tarik Gacha 1 Kali',
                    'progress' => min($user->quest_gacha_count, 1),
                    'target' => 1,
                    'is_claimed' => (bool)$user->quest_gacha_claimed,
                    'reward_text' => '30 Gems'
                ],
                [
                    'id' => 'chat',
                    'title' => 'Kirim 3 Pesan ke Waifu',
                    'progress' => min($user->quest_chat_count, 3),
                    'target' => 3,
                    'is_claimed' => (bool)$user->quest_chat_claimed,
                    'reward_text' => '1 Tiket Gacha'
                ]
            ]
        ]);
    }

    public function claimQuest(Request $request)
    {
        $request->validate([
            'quest_id' => 'required|string|in:gacha,chat',
        ]);

        $user = $request->user();
        $user->checkQuestsReset();

        $questId = $request->quest_id;

        if ($questId === 'gacha') {
            if ($user->quest_gacha_count < 1) {
                return response()->json(['error' => 'Misi belum selesai.'], 400);
            }
            if ($user->quest_gacha_claimed) {
                return response()->json(['error' => 'Hadiah sudah diambil.'], 400);
            }
            $user->gems += 30;
            $user->quest_gacha_claimed = true;
        } elseif ($questId === 'chat') {
            if ($user->quest_chat_count < 3) {
                return response()->json(['error' => 'Misi belum selesai.'], 400);
            }
            if ($user->quest_chat_claimed) {
                return response()->json(['error' => 'Hadiah sudah diambil.'], 400);
            }
            $user->tickets += 1;
            $user->quest_chat_claimed = true;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Hadiah berhasil diklaim!',
            'gems' => $user->gems,
            'tickets' => $user->tickets,
            'energy' => $user->energy
        ]);
    }
}
