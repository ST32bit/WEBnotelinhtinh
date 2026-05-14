<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoteAttachment extends Model
{
    public $timestamps = false;
    protected $fillable = ['note_id', 'file_name', 'file_path', 'file_type', 'file_size'];

    public function note()
    {
        return $this->belongsTo(Note::class);
    }
}
