<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'gems',
        'energy',
        'last_claim_date',
        'tickets',
        'quest_date',
        'quest_gacha_count',
        'quest_chat_count',
        'quest_gacha_claimed',
        'quest_chat_claimed',
        'last_energy_regen',
        'showcase_waifu_ids',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'showcase_waifu_ids' => 'array',
        ];
    }

    public function waifus()
    {
        return $this->belongsToMany(Waifu::class, 'user_waifu')
                    ->withPivot('affection_level', 'level', 'chat_token')
                    ->withTimestamps();
    }

    public function mails()
    {
        return $this->hasMany(Mail::class);
    }

    public function chatHistories()
    {
        return $this->hasMany(ChatHistory::class);
    }

    public function gachaLogs()
    {
        return $this->hasMany(GachaLog::class);
    }

    public function checkQuestsReset()
    {
        $today = \Carbon\Carbon::today()->toDateString();
        if ($this->quest_date !== $today) {
            $this->quest_date = $today;
            $this->quest_gacha_count = 0;
            $this->quest_chat_count = 0;
            $this->quest_gacha_claimed = false;
            $this->quest_chat_claimed = false;
            $this->save();
        }
    }

    public function applyEnergyRegen(): void
    {
        $maxEnergy = 100;
        if ($this->energy >= $maxEnergy) {
            $this->last_energy_regen = \Carbon\Carbon::now();
            $this->save();
            return;
        }

        $lastRegen = $this->last_energy_regen
            ? \Carbon\Carbon::parse($this->last_energy_regen)
            : \Carbon\Carbon::now()->subMinutes(10); // Kalau null, anggap sudah waktunya regen

        $minutesElapsed = (int) $lastRegen->diffInMinutes(\Carbon\Carbon::now());
        $energyToAdd   = (int) floor($minutesElapsed / 10); // 1 per 10 menit

        if ($energyToAdd > 0) {
            $this->energy = min($maxEnergy, $this->energy + $energyToAdd);
            // Geser last_energy_regen ke depan sejumlah menit yang sudah dipakai
            $minutesUsed = $energyToAdd * 10;
            $this->last_energy_regen = $lastRegen->addMinutes($minutesUsed);
            $this->save();
        }
    }
}
