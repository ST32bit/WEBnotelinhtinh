<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SharedNote extends Model
{
    protected $fillable = ['note_id', 'owner_id', 'shared_with', 'role'];

    public function note()
    {
        return $this->belongsTo(Note::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function sharedUser()
    {
        return $this->belongsTo(User::class, 'shared_with');
    }
}
