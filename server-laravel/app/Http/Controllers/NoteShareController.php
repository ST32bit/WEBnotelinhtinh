<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\SharedNote;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteShareController extends Controller
{
    /** Tiêu chí 25: Lấy notes được chia sẻ với tôi */
    public function index(Request $request): JsonResponse
    {
        $shared = SharedNote::with(['note.labels', 'note.attachments', 'owner'])
            ->where('shared_with', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($s) => $s->note !== null) // safety: skip deleted notes
            ->map(fn ($s) => array_merge($s->note->toArray(), [
                'share_id'    => $s->id,
                'role'        => $s->role,
                'owner_name'  => $s->owner->display_name,
                'owner_email' => $s->owner->email,
                'shared_at'   => $s->created_at->toDateTimeString(),
            ]));

        return response()->json(['success' => true, 'notes' => $shared->values()]);
    }

    /** Tiêu chí 25: Chia sẻ note — Better Approach: validate email, notify */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'note_id' => 'required|integer',
            'email'   => 'required|email',
            'role'    => 'nullable|in:viewer,editor',
        ]);

        $userId = $request->user()->id;
        $note   = Note::where('id', $request->note_id)->where('user_id', $userId)->firstOrFail();
        $target = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$target) {
            return response()->json(['error' => 'Không tìm thấy người dùng đã kích hoạt với email này'], 404);
        }
        if ($target->id === $userId) {
            return response()->json(['error' => 'Không thể chia sẻ với chính mình'], 400);
        }

        $share = SharedNote::updateOrCreate(
            ['note_id' => $note->id, 'shared_with' => $target->id],
            ['owner_id' => $userId, 'role' => $request->input('role', 'viewer')]
        );

        // Load share details for response
        $share->load('sharedUser');

        return response()->json([
            'success' => true,
            'message' => "Đã chia sẻ với {$request->email}",
            'share'   => [
                'id'           => $share->id,
                'role'         => $share->role,
                'email'        => $share->sharedUser->email,
                'display_name' => $share->sharedUser->display_name,
            ],
        ]);
    }

    /** Tiêu chí 25: Cập nhật quyền chia sẻ */
    public function updateRole(Request $request): JsonResponse
    {
        $request->validate([
            'share_id' => 'required|integer',
            'role'     => 'required|in:viewer,editor',
        ]);

        $share = SharedNote::where('id', $request->share_id)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $share->update(['role' => $request->role]);

        return response()->json(['success' => true, 'message' => 'Đã cập nhật quyền']);
    }

    /** Tiêu chí 25: Hủy chia sẻ */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'note_id'     => 'required|integer',
            'shared_with' => 'required|integer',
        ]);

        SharedNote::where('note_id', $request->note_id)
            ->where('owner_id', $request->user()->id)
            ->where('shared_with', $request->shared_with)
            ->delete();

        return response()->json(['success' => true, 'message' => 'Đã hủy chia sẻ']);
    }

    /**
     * Fix 1.3: PUBLIC route — View a shared note by ID
     * No auth required if note visibility is 'link' or 'public'
     * Auth required if note is shared privately
     */
    public function showPublic(Request $request, int $noteId): JsonResponse
    {
        $note = Note::with(['labels', 'attachments', 'user:id,display_name,email,avatar'])->find($noteId);

        if (!$note) {
            return response()->json(['error' => 'Note không tồn tại'], 404);
        }

        // Public notes: anyone can view
        if ($note->visibility === 'public') {
            return response()->json([
                'success' => true,
                'note'    => $note,
                'role'    => 'viewer',
                'owner'   => $note->user,
            ]);
        }

        // Link-shared notes: anyone with the link can view
        if ($note->visibility === 'link') {
            return response()->json([
                'success' => true,
                'note'    => $note,
                'role'    => 'viewer',
                'owner'   => $note->user,
            ]);
        }

        // Private notes: must be authenticated and shared with the user
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Bạn cần đăng nhập để xem note này'], 401);
        }

        // Owner can always view
        if ($note->user_id === $user->id) {
            return response()->json([
                'success' => true,
                'note'    => $note,
                'role'    => 'owner',
                'owner'   => $note->user,
            ]);
        }

        // Check if shared with this user
        $share = SharedNote::where('note_id', $noteId)
            ->where('shared_with', $user->id)
            ->first();

        if (!$share) {
            return response()->json(['error' => 'Bạn không có quyền xem note này'], 403);
        }

        return response()->json([
            'success' => true,
            'note'    => $note,
            'role'    => $share->role,
            'owner'   => $note->user,
        ]);
    }
}
