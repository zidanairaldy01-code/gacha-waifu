<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Waifu;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * GET /api/profile/{username} — Publik, tanpa auth
     */
    public function show(string $username)
    {
        $user = User::where('username', $username)->first();

        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan.'], 404);
        }

        // Statistik koleksi
        $waifus = $user->waifus()->withPivot('affection_level', 'level', 'chat_token')->get();
        $totalCollection = $waifus->count();
        $totalSSR = $waifus->where('rarity', 'SSR')->count();
        $totalAffection = $waifus->sum(fn($w) => $w->pivot->affection_level ?? 0);

        // Showcase waifus
        $showcaseIds = $user->showcase_waifu_ids ?? [];
        $showcaseWaifus = [];

        if (!empty($showcaseIds)) {
            $owned = $waifus->keyBy('id');
            foreach ($showcaseIds as $wid) {
                if (isset($owned[$wid])) {
                    $w = $owned[$wid];
                    $showcaseWaifus[] = [
                        'id'              => $w->id,
                        'name'            => $w->name,
                        'rarity'          => $w->rarity,
                        'image_url'       => $w->image_url,
                        'affection_level' => $w->pivot->affection_level,
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id'               => $user->id,
                'name'             => $user->name,
                'username'         => $user->username,
                'total_collection' => $totalCollection,
                'total_ssr'        => $totalSSR,
                'total_affection'  => $totalAffection,
                'showcase_waifus'  => $showcaseWaifus,
            ],
        ]);
    }

    /**
     * PUT /api/profile/showcase — Auth required
     * Body: { waifu_ids: [1, 2, 3, ...] } max 6
     */
    public function updateShowcase(Request $request)
    {
        $request->validate([
            'waifu_ids'   => 'required|array|max:6',
            'waifu_ids.*' => 'integer',
        ]);

        $user = $request->user();
        $ids = array_slice(array_unique($request->waifu_ids), 0, 6);

        // Pastikan semua waifu yang dipilih memang dimiliki user
        $ownedIds = $user->waifus()->pluck('waifu_id')->toArray();
        $validIds = array_values(array_filter($ids, fn($id) => in_array($id, $ownedIds)));

        $user->showcase_waifu_ids = $validIds;
        $user->save();

        return response()->json([
            'success'            => true,
            'showcase_waifu_ids' => $validIds,
        ]);
    }
}
