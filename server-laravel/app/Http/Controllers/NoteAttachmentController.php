<?php

namespace App\Http\Controllers;

use App\Models\NoteAttachment;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NoteAttachmentController extends Controller
{
    /** Tiêu chí 20: Upload ảnh đính kèm */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'note_id' => 'required|integer',
            'files'   => 'required|array',
            'files.*' => 'file|mimes:jpeg,png,gif,webp|max:5120', // max 5MB
        ]);

        $note = Note::where('id', $request->note_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $uploaded = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('attachments', 'public');

            $attachment = $note->attachments()->create([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]);

            $uploaded[] = $attachment;
        }

        return response()->json(['success' => true, 'attachments' => $uploaded]);
    }

    /** Tiêu chí 20: Xóa attachment */
    public function destroy(Request $request, NoteAttachment $attachment): JsonResponse
    {
        // Verify ownership thông qua note
        if ($attachment->note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['success' => true, 'message' => 'Đã xóa file đính kèm']);
    }
}
