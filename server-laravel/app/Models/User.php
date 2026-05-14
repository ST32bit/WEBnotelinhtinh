<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email', 'username', 'display_name', 'password',
        'avatar', 'bio', 'accent_color',
        'is_active', 'activation_token', 'activation_expiry',
        'reset_token', 'reset_expiry', 'preferences',
    ];

    protected $hidden = [
        'password', 'activation_token', 'reset_token',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'activation_expiry' => 'datetime',
        'reset_expiry'      => 'datetime',
        'preferences'       => 'array',
    ];

    // ── Relationships ──

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function labels()
    {
        return $this->hasMany(Label::class);
    }

    public function sharedNotesReceived()
    {
        return $this->hasMany(SharedNote::class, 'shared_with');
    }
}
