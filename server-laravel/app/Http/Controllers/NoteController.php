<?php

namespace App\Http\Controllers;

use App\Http\Requests\NoteRequest;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class NoteController extends Controller
{
    /**
     * Tiêu chí 9, 10, 14, 15, 16: List notes
     * Supports: search (q), label filter (label_id), sort, pagination
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = $user->notes()->with(['labels', 'attachments', 'shares.sharedUser']);

        // Tiêu chí 14: Live search on title + content
        if ($q = $request->input('q')) {
            $query->search($q);
        }

        // Tiêu chí 15: Filter by label
        if ($labelId = $request->input('label_id')) {
            $query->whereHas('labels', fn ($q) => $q->where('labels.id', $labelId));
        }

        // Tiêu chí 16: Sort with pinned first
        $sort  = $request->input('sort', 'updated_at');
        $order = $request->input('order', 'desc');
        $query->sorted($sort, $order);

        // Pagination
        $page  = max(1, (int) $request->input('page', 1));
        $limit = min(100, max(1, (int) $request->input('limit', 50)));
        $total = $query->count();
        $notes = $query->skip(($page - 1) * $limit)->take($limit)->get();

        // Transform: include shareList + has_password flag
        $notes->each(function ($note) {
            $note->shareList = $note->shares->map(fn ($s) => [
                'id'           => $s->id,
<<<<<<< HEAD
                'shared_with'  => $s->shared_with,
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
                'role'         => $s->role,
                'email'        => $s->sharedUser->email ?? '',
                'display_name' => $s->sharedUser->display_name ?? '',
            ]);
            // Expose boolean flag without leaking hash
            $note->has_password = !empty($note->note_password);
            unset($note->shares);
        });

        return response()->json([
            'success' => true,
            'notes'   => $notes,
            'total'   => $total,
            'page'    => $page,
            'limit'   => $limit,
        ]);
    }

    /**
     * Tiêu chí 11: Tạo note (CHỈ title + content)
     * Auto-save compatible: accepts partial data
     */
    public function store(NoteRequest $request): JsonResponse
    {
        $note = $request->user()->notes()->create([
            'title'   => $request->title,
            'content' => $request->input('content', ''),
        ]);

<<<<<<< HEAD
        // Allow setting created_at for calendar-based note creation
        if ($request->filled('created_at')) {
            $note->created_at = $request->created_at;
            $note->save();
        }

        // Set password if provided during creation
        if ($request->filled('password')) {
            $note->update(['note_password' => \Illuminate\Support\Facades\Hash::make($request->password)]);
        }

=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
        // Gắn labels nếu có
        if ($request->has('label_ids')) {
            $note->labels()->sync($request->label_ids);
        }

        $note->load(['labels', 'attachments']);
        $note->shareList = [];
<<<<<<< HEAD
        $note->has_password = !empty($note->note_password);
=======
        $note->has_password = false;
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d

        return response()->json(['success' => true, 'note' => $note], 201);
    }

    /**
     * Tiêu chí 12: Cập nhật note (Auto-save compatible)
     */
    public function update(NoteRequest $request, Note $note): JsonResponse
    {
        // Policy: chỉ owner mới được sửa
        if ($note->user_id !== $request->user()->id) {
<<<<<<< HEAD
            // If note has password, shared users are forced to view-only
            if ($note->note_password) {
                return response()->json(['error' => 'Note bị khóa mật khẩu — chỉ được xem'], 403);
            }
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
            // Check if shared with editor role
            $share = $note->shares()
                ->where('shared_with', $request->user()->id)
                ->where('role', 'editor')
                ->first();
            if (!$share) {
                return response()->json(['error' => 'Không có quyền'], 403);
            }
        }

<<<<<<< HEAD
        $updateData = [
            'title'   => $request->title,
            'content' => $request->input('content', ''),
        ];
        if ($request->has('visibility')) {
            $updateData['visibility'] = $request->visibility;
        }
        $note->update($updateData);
=======
        $note->update([
            'title'   => $request->title,
            'content' => $request->input('content', ''),
        ]);
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d

        if ($request->has('label_ids')) {
            $note->labels()->sync($request->label_ids);
        }

        $note->load(['labels', 'attachments', 'shares.sharedUser']);
        $note->shareList = $note->shares->map(fn ($s) => [
            'id'           => $s->id,
<<<<<<< HEAD
            'shared_with'  => $s->shared_with,
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
            'role'         => $s->role,
            'email'        => $s->sharedUser->email ?? '',
            'display_name' => $s->sharedUser->display_name ?? '',
        ]);
        $note->has_password = !empty($note->note_password);
        unset($note->shares);

        return response()->json(['success' => true, 'note' => $note]);
    }

    /**
     * Tiêu chí 13: Xóa note (requires confirmation on frontend)
     */
    public function destroy(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        // Xóa file đính kèm trên disk
        foreach ($note->attachments as $att) {
            \Storage::disk('public')->delete($att->file_path);
        }

        $note->delete(); // CASCADE sẽ xóa note_labels, attachments, shares

        return response()->json(['success' => true, 'message' => 'Đã xóa note']);
    }

    /**
     * Tiêu chí 17: Toggle pin
     */
    public function togglePin(Request $request): JsonResponse
    {
        $request->validate(['note_id' => 'required|integer']);

        $note = Note::where('id', $request->note_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $note->update(['is_pinned' => !$note->is_pinned]);

        return response()->json([
            'success'   => true,
            'is_pinned' => $note->is_pinned,
            'message'   => $note->is_pinned ? 'Đã ghim note' : 'Đã bỏ ghim note',
        ]);
    }

    /**
     * Tiêu chí 18: Password-Protected Notes — BETTER APPROACH
     * 
     * Actions:
     *   set    → password + password_confirm (enter twice)
     *   verify → password (unlock note)
     *   change → current_password + password + password_confirm
     *   remove → current_password (must verify before removing)
     */
    public function lock(Request $request): JsonResponse
    {
        $request->validate([
            'note_id'  => 'required|integer',
            'action'   => 'required|in:set,verify,change,remove',
        ]);

        $note = Note::where('id', $request->note_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $action = $request->action;

        // ── SET: Create password (enter twice to confirm) ──
        if ($action === 'set') {
            $request->validate([
                'password'         => 'required|string|min:4',
                'password_confirm' => 'required|string|same:password',
            ], [
                'password.min'          => 'Mật khẩu ít nhất 4 ký tự',
                'password_confirm.same' => 'Xác nhận mật khẩu không khớp',
            ]);

            if ($note->note_password) {
                return response()->json(['error' => 'Note đã có mật khẩu. Dùng action "change" để đổi.'], 400);
            }

            $note->update(['note_password' => Hash::make($request->password)]);
            return response()->json(['success' => true, 'message' => 'Đã đặt mật khẩu cho note']);
        }

        // ── VERIFY: Unlock note to view/edit/delete ──
        if ($action === 'verify') {
            if (!$note->note_password) {
                return response()->json(['success' => true, 'verified' => true]);
            }
            $request->validate(['password' => 'required|string']);
            if (Hash::check($request->password, $note->note_password)) {
                return response()->json(['success' => true, 'verified' => true]);
            }
            return response()->json(['error' => 'Mật khẩu không đúng', 'verified' => false], 401);
        }

        // ── CHANGE: Current password + New password twice ──
        if ($action === 'change') {
            $request->validate([
                'current_password' => 'required|string',
                'password'         => 'required|string|min:4',
                'password_confirm' => 'required|string|same:password',
            ], [
                'password.min'          => 'Mật khẩu mới ít nhất 4 ký tự',
                'password_confirm.same' => 'Xác nhận mật khẩu mới không khớp',
            ]);

            if (!$note->note_password || !Hash::check($request->current_password, $note->note_password)) {
                return response()->json(['error' => 'Mật khẩu hiện tại không đúng'], 401);
            }

            $note->update(['note_password' => Hash::make($request->password)]);
            return response()->json(['success' => true, 'message' => 'Đã đổi mật khẩu note']);
        }

        // ── REMOVE: Must enter current password to disable ──
        if ($action === 'remove') {
            $request->validate(['current_password' => 'required|string']);

            if (!$note->note_password) {
                return response()->json(['error' => 'Note chưa có mật khẩu'], 400);
            }
            if (!Hash::check($request->current_password, $note->note_password)) {
                return response()->json(['error' => 'Mật khẩu không đúng'], 401);
            }

            $note->update(['note_password' => null]);
            return response()->json(['success' => true, 'message' => 'Đã gỡ mật khẩu']);
        }

        return response()->json(['error' => 'Action không hợp lệ'], 400);
    }

    /**
     * Tiêu chí 21 + 26: Polling real-time
     */
    public function poll(Request $request): JsonResponse
    {
        $since = $request->input('since', now()->subSeconds(10)->toDateTimeString());
        $user  = $request->user();

        $changed = $user->notes()
            ->where('updated_at', '>', $since)
            ->orderByDesc('updated_at')
            ->get();

        $sharedChanged = Note::whereHas('shares', fn ($q) => $q->where('shared_with', $user->id))
            ->where('updated_at', '>', $since)
            ->get();

        return response()->json([
            'success'        => true,
            'changed_notes'  => $changed,
            'shared_changed' => $sharedChanged,
            'server_time'    => now()->toDateTimeString(),
        ]);
    }
}
