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
<<<<<<< HEAD
            ->filter(fn ($s) => $s->note !== null)
            ->map(fn ($s) => array_merge($s->note->toArray(), [
                'share_id'    => $s->id,
                'role'        => $s->role,
                'is_seen'     => (bool)$s->is_seen,
=======
            ->filter(fn ($s) => $s->note !== null) // safety: skip deleted notes
            ->map(fn ($s) => array_merge($s->note->toArray(), [
                'share_id'    => $s->id,
                'role'        => $s->role,
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
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

<<<<<<< HEAD
        $user   = $request->user();
        $userId = $user->id;
=======
        $userId = $request->user()->id;
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
        $note   = Note::where('id', $request->note_id)->where('user_id', $userId)->firstOrFail();
        $target = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$target) {
            return response()->json(['error' => 'Không tìm thấy người dùng đã kích hoạt với email này'], 404);
        }
        if ($target->id === $userId) {
            return response()->json(['error' => 'Không thể chia sẻ với chính mình'], 400);
        }

<<<<<<< HEAD
        $isNew = !SharedNote::where('note_id', $note->id)->where('shared_with', $target->id)->exists();

        $share = SharedNote::updateOrCreate(
            ['note_id' => $note->id, 'shared_with' => $target->id],
            ['owner_id' => $userId, 'role' => $request->input('role', 'viewer'), 'is_seen' => false]
        );

        // Better Approach: Gửi email thông báo
        if ($isNew) {
            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->CharSet = 'UTF-8';
                $mail->isSMTP();
                $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
                $mail->SMTPAuth   = true;
                $mail->Username   = env('MAIL_USERNAME');
                $mail->Password   = env('MAIL_PASSWORD');
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = (int) env('MAIL_PORT', 587);

                $mail->setFrom(env('MAIL_USERNAME'), env('MAIL_FROM_NAME', 'NoteApp'));
                $mail->addAddress($target->email, $target->display_name);

                $mail->isHTML(true);
                $mail->Subject = '=?UTF-8?B?' . base64_encode("Một ghi chú đã được chia sẻ với bạn: {$note->title}") . '?=';
                $mail->Body    = "Xin chào <b>{$target->display_name}</b>,<br><br><b>{$user->display_name}</b> ({$user->email}) đã chia sẻ ghi chú <b>\"{$note->title}\"</b> với bạn.<br><br>Bạn có quyền: <b>" . ($share->role === 'editor' ? 'Chỉnh sửa' : 'Xem') . "</b>.<br><br>Đăng nhập vào NoteApp để xem ngay!";
                $mail->AltBody = "Xin chào {$target->display_name},\n\n{$user->display_name} ({$user->email}) đã chia sẻ ghi chú \"{$note->title}\" với bạn.\n\nĐăng nhập vào NoteApp để xem ngay!";

                $mail->send();
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Illuminate\Support\Facades\Log::error("Email share error: " . $e->getMessage());
            }
        }

        $share->load('sharedUser');
=======
        $share = SharedNote::updateOrCreate(
            ['note_id' => $note->id, 'shared_with' => $target->id],
            ['owner_id' => $userId, 'role' => $request->input('role', 'viewer')]
        );

        // Load share details for response
        $share->load('sharedUser');

>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
        return response()->json([
            'success' => true,
            'message' => "Đã chia sẻ với {$request->email}",
            'share'   => [
                'id'           => $share->id,
<<<<<<< HEAD
                'shared_with'  => $share->shared_with,
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
                'role'         => $share->role,
                'email'        => $share->sharedUser->email,
                'display_name' => $share->sharedUser->display_name,
            ],
        ]);
    }

<<<<<<< HEAD
    /** Tiêu chí 25: Đánh dấu đã xem thông báo */
    public function markAsSeen(Request $request): JsonResponse
    {
        $request->validate(['share_id' => 'required|integer']);
        
        SharedNote::where('id', $request->share_id)
            ->where('shared_with', $request->user()->id)
            ->update(['is_seen' => true]);

        return response()->json(['success' => true]);
    }

=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
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
<<<<<<< HEAD

    /**
     * Public Join: Auto-add a public note to user's shared list (view-only)
     * When an authenticated user visits a public link, this creates a SharedNote record
     */
    public function publicJoin(Request $request, int $noteId): JsonResponse
    {
        $note = Note::with(['labels', 'attachments', 'user:id,display_name,email,avatar'])->find($noteId);

        if (!$note) {
            return response()->json(['error' => 'Note không tồn tại'], 404);
        }

        if ($note->visibility !== 'public') {
            return response()->json(['error' => 'Note này không được chia sẻ công khai'], 403);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Bạn cần đăng nhập để thêm note này'], 401);
        }

        // Owner doesn't need to join their own note
        if ($note->user_id === $user->id) {
            return response()->json(['success' => true, 'message' => 'Đây là note của bạn', 'is_owner' => true]);
        }

        // Auto-create shared record as viewer (public = read-only)
        SharedNote::updateOrCreate(
            ['note_id' => $note->id, 'shared_with' => $user->id],
            ['owner_id' => $note->user_id, 'role' => 'viewer', 'is_seen' => false]
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm note vào danh sách chia sẻ của bạn',
            'note' => $note,
            'owner' => $note->user,
        ]);
    }
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
}
