<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Waifu extends Model
{
    use HasFactory;

    protected $table = 'waifus';
    
    protected $fillable = [
        'name',
        'rarity',
        'description',
        'base_prompt',
        'image_url',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_waifu')
                    ->withPivot('affection_level', 'level')
                    ->withTimestamps();
    }

    public function banner()
    {
        return $this->belongsTo(Banner::class);
    }
}
