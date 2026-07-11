<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mail extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'message',
        'reward_gems',
        'reward_tickets',
        'is_special_dialog',
        'is_read',
        'is_claimed',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_claimed' => 'boolean',
        'is_special_dialog' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
