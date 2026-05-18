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
        $user = $request->user();
        $query = Note::with(['labels', 'attachments', 'shares.sharedUser', 'user'])
            ->where('user_id', $user->id);

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
        $notes->each(function ($note) use ($user) {
            $note->shareList = $note->shares->map(fn ($s) => [
                'id'           => $s->id,
                'shared_with'  => $s->shared_with,
                'role'         => $s->role,
                'email'        => $s->sharedUser->email ?? '',
                'display_name' => $s->sharedUser->display_name ?? '',
            ]);
            // Expose boolean flag without leaking hash
            $note->has_password = !empty($note->note_password);
            
            // Mark if this note is shared to the current user
            $shareToCurrentUser = $note->shares->firstWhere('shared_with', $user->id);
            if ($note->user_id !== $user->id && $shareToCurrentUser) {
                $note->is_shared = true;
                $note->my_role = $shareToCurrentUser->role;
                $note->owner_name = $note->user->display_name ?? 'Người khác';
            } else {
                $note->is_shared = false;
                $note->my_role = 'owner';
            }
            
            unset($note->shares);
            unset($note->user); // We already extracted owner_name if needed
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
            'title'       => $request->title,
            'content'     => $request->input('content', ''),
            'color'       => $request->color,
            'font_family' => $request->font_family,
            'font_size'   => $request->font_size,
            'text_color'  => $request->text_color,
        ]);

        // Allow setting created_at for calendar-based note creation
        if ($request->filled('created_at')) {
            $note->created_at = $request->created_at;
            $note->updated_at = $request->created_at;
            $note->save();
        }

        // Set password if provided during creation
        if ($request->filled('password')) {
            $note->update(['note_password' => \Illuminate\Support\Facades\Hash::make($request->password)]);
        }

        // Gắn labels nếu có
        if ($request->has('label_ids')) {
            $note->labels()->sync($request->label_ids);
        }

        $note->load(['labels', 'attachments']);
        $note->shareList = [];
        $note->has_password = !empty($note->note_password);

        return response()->json(['success' => true, 'note' => $note], 201);
    }

    /**
     * Tiêu chí 12: Cập nhật note (Auto-save compatible)
     */
    public function update(NoteRequest $request, Note $note): JsonResponse
    {
        // Policy: chỉ owner mới được sửa
        if ($note->user_id !== $request->user()->id) {
            // If note has password, shared users are forced to view-only
            if ($note->note_password) {
                return response()->json(['error' => 'Note bị khóa mật khẩu — chỉ được xem'], 403);
            }
            // Check if shared with editor role
            $share = $note->shares()
                ->where('shared_with', $request->user()->id)
                ->where('role', 'editor')
                ->first();
            if (!$share) {
                return response()->json(['error' => 'Không có quyền'], 403);
            }
        }

        $updateData = [
            'title'   => $request->title,
            'content' => $request->input('content', ''),
        ];
        if ($request->has('visibility')) {
            $updateData['visibility'] = $request->visibility;
        }
        if ($request->has('color')) {
            $updateData['color'] = $request->color;
        }
        if ($request->has('font_family')) {
            $updateData['font_family'] = $request->font_family;
        }
        if ($request->has('font_size')) {
            $updateData['font_size'] = $request->font_size;
        }
        if ($request->has('text_color')) {
            $updateData['text_color'] = $request->text_color;
        }
        $note->update($updateData);

        if ($request->has('label_ids')) {
            $note->labels()->sync($request->label_ids);
        }
        self::syncSharedLabels($note);

        $note->load(['labels', 'attachments', 'shares.sharedUser']);
        $note->shareList = $note->shares->map(fn ($s) => [
            'id'           => $s->id,
            'shared_with'  => $s->shared_with,
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
        $user = $request->user();

        // Nếu người xóa KHÔNG PHẢI là chủ sở hữu
        if ($note->user_id !== $user->id) {
            $share = SharedNote::where('note_id', $note->id)
                ->where('shared_with', $user->id)
                ->first();

            if ($share) {
                $share->delete();
                return response()->json(['success' => true, 'message' => 'Đã gỡ bạn khỏi ghi chú chia sẻ này']);
            }

            return response()->json(['error' => 'Bạn không có quyền xóa ghi chú này'], 403);
        }

        // Xóa file đính kèm trên disk
        foreach ($note->attachments as $att) {
            \Storage::disk('public')->delete($att->file_path);
        }

        $note->delete(); // CASCADE sẽ xóa note_labels, attachments, shares

        return response()->json(['success' => true, 'message' => 'Đã xóa ghi chú thành công']);
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
                'password'         => 'required|string',
                'password_confirm' => 'required|string|same:password',
            ], [
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
            return response()->json(['error' => 'Mật khẩu không đúng', 'verified' => false], 403);
        }

        // ── CHANGE: Current password + New password twice ──
        if ($action === 'change') {
            $request->validate([
                'current_password' => 'required|string',
                'password'         => 'required|string',
                'password_confirm' => 'required|string|same:password',
            ], [
                'password_confirm.same' => 'Xác nhận mật khẩu mới không khớp',
            ]);

            if (!$note->note_password || !Hash::check($request->current_password, $note->note_password)) {
                return response()->json(['error' => 'Mật khẩu hiện tại không đúng'], 403);
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
                return response()->json(['error' => 'Mật khẩu không đúng'], 403);
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

    /**
     * Đồng bộ nhãn dán giữa cha (owner) và các con (shared users)
     */
    public static function syncSharedLabels(Note $note)
    {
        $ownerId = $note->user_id;
        $sharedUserIds = $note->shares()->pluck('shared_with')->toArray();
        $allUserIds = array_unique(array_merge([$ownerId], $sharedUserIds));

        if (count($allUserIds) <= 1) {
            return; // Không có chia sẻ, không cần đồng bộ
        }

        // Lấy danh sách các nhãn dán hiện đang được gắn vào note này
        $currentLabels = $note->labels()->get();

        // Gom các label name duy nhất (không phân biệt chữ hoa chữ thường)
        $labelNames = $currentLabels->pluck('name')
            ->map(fn($n) => trim($n))
            ->filter()
            ->unique(fn($n) => strtolower($n))
            ->toArray();

        $allAttachedLabelIds = [];

        foreach ($allUserIds as $userId) {
            foreach ($labelNames as $name) {
                // Kiểm tra xem user này đã có nhãn dán trùng tên chưa
                $userLabel = \App\Models\Label::where('user_id', $userId)
                    ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->first();

                if (!$userLabel) {
                    // Nếu chưa có thì tự động tạo mới
                    $sampleLabel = $currentLabels->first(fn($l) => strtolower(trim($l->name)) === strtolower($name));
                    $color = $sampleLabel ? $sampleLabel->color : '#6366f1';

                    $userLabel = \App\Models\Label::create([
                        'user_id' => $userId,
                        'name'    => $name,
                        'color'   => $color,
                    ]);
                }

                $allAttachedLabelIds[] = $userLabel->id;
            }
        }

        // Đồng bộ lại bảng note_labels chứa toàn bộ ID của cả cha và con
        $note->labels()->sync(array_unique($allAttachedLabelIds));
    }
}
