<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Note extends Model
{
    protected $fillable = [
        'user_id', 'title', 'content',
        'is_pinned', 'note_password', 'visibility',
        'color', 'font_family', 'font_size', 'text_color',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    protected $hidden = ['note_password'];

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Tiêu chí 15: Note ↔ Labels (many-to-many) */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'note_labels');
    }

    /** Tiêu chí 20: Attachments */
    public function attachments(): HasMany
    {
        return $this->hasMany(NoteAttachment::class);
    }

    /** Tiêu chí 25: Shares */
    public function shares(): HasMany
    {
        return $this->hasMany(SharedNote::class);
    }

    // ── Scopes ──

    /** Tiêu chí 14: Full-text search */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'LIKE', "%{$term}%")
              ->orWhere('content', 'LIKE', "%{$term}%");
        });
    }

    /** Tiêu chí 16: Sort with pinned first */
    public function scopeSorted($query, string $sort = 'updated_at', string $order = 'desc')
    {
        $allowed = ['updated_at', 'created_at', 'title', 'is_pinned'];
        $sort = in_array($sort, $allowed) ? $sort : 'updated_at';
        $order = strtolower($order) === 'asc' ? 'asc' : 'desc';

        return $query->orderByDesc('is_pinned')->orderBy($sort, $order);
    }

    // ── Accessors ──

    /**
     * Fix 2.3: has_password boolean accessor
     * Never exposes the hash — only returns true/false
     */
    public function getHasPasswordAttribute(): bool
    {
        return !empty($this->note_password);
    }

    /**
     * Append has_password to every JSON response
     */
    protected $appends = ['has_password'];
}
