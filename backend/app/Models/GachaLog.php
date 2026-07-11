<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GachaLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'waifu_id',
        'pull_number',
        'is_pity',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function waifu()
    {
        return $this->belongsTo(Waifu::class);
    }
}
