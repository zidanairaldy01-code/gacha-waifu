<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Banner extends Model
{
    protected $fillable = ['name', 'description', 'theme_color', 'is_active'];

    public function waifus(): HasMany
    {
        return $this->hasMany(Waifu::class);
    }
}
