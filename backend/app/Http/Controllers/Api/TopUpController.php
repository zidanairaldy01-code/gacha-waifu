<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TopUpController extends Controller
{
    // Paket gems yang sama dengan frontend
    private const PACKAGES = [
        'pack_60'    => ['gems' => 60,    'bonus' => 0,    'price' => 15000],
        'pack_300'   => ['gems' => 300,   'bonus' => 30,   'price' => 65000],
        'pack_980'   => ['gems' => 980,   'bonus' => 110,  'price' => 179000],
        'pack_1980'  => ['gems' => 1980,  'bonus' => 260,  'price' => 349000],
        'pack_3280'  => ['gems' => 3280,  'bonus' => 600,  'price' => 579000],
        'pack_6480'  => ['gems' => 6480,  'bonus' => 1600, 'price' => 1099000],
    ];

    public function processTopUp(Request $request)
    {
        $request->validate([
            'package_id' => 'required|string',
        ]);

        $packageId = $request->input('package_id');

        if (!isset(self::PACKAGES[$packageId])) {
            return response()->json(['error' => 'Paket tidak valid.'], 400);
        }

        $package = self::PACKAGES[$packageId];
        $totalGems = $package['gems'] + $package['bonus'];

        $user = $request->user();
        $user->gems += $totalGems;
        $user->save();

        return response()->json([
            'success'        => true,
            'gems_added'     => $totalGems,
            'remaining_gems' => $user->gems,
            'message'        => "Berhasil menambahkan {$totalGems} Gems ke akunmu!",
        ]);
    }
}
