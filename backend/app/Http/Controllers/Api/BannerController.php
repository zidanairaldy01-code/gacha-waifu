<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Banner;

class BannerController extends Controller
{
    public function getActiveBanners()
    {
        $banners = Banner::where('is_active', true)->with('waifus')->get();
        return response()->json([
            'success' => true,
            'data' => $banners,
        ]);
    }
}
