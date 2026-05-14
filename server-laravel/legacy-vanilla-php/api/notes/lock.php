<?php
// api/notes/lock.php — Khóa / Mở khóa note bằng mật khẩu (Tiêu chí 18)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth   = authenticate();
$userId = $auth['user_id'];
$input  = json_decode(file_get_contents('php://input'), true);
$noteId = intval($input['note_id'] ?? 0);
$action = $input['action'] ?? '';  // 'set', 'verify', 'remove'
$password = $input['password'] ?? '';

if (!$noteId || !$action) {
    http_response_code(400);
    echo json_encode(['error' => 'note_id và action là bắt buộc']);
    exit;
}

// Verify ownership
$stmt = $pdo->prepare('SELECT id, note_password FROM notes WHERE id = ? AND user_id = ?');
$stmt->execute([$noteId, $userId]);
$note = $stmt->fetch();

if (!$note) {
    http_response_code(403);
    echo json_encode(['error' => 'Không có quyền']);
    exit;
}

// ── SET: Đặt mật khẩu note (Tiêu chí 18) ──
if ($action === 'set') {
    if (!$password || strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['error' => 'Mật khẩu phải có ít nhất 4 ký tự']);
        exit;
    }
    $hashed = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE notes SET note_password = ? WHERE id = ?');
    $stmt->execute([$hashed, $noteId]);
    echo json_encode(['success' => true, 'message' => 'Đã đặt mật khẩu cho note']);
    exit;
}

// ── VERIFY: Xác minh mật khẩu (Tiêu chí 18) ──
if ($action === 'verify') {
    if (!$note['note_password']) {
        echo json_encode(['success' => true, 'verified' => true]);
        exit;
    }
    if (password_verify($password, $note['note_password'])) {
        echo json_encode(['success' => true, 'verified' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Mật khẩu không đúng', 'verified' => false]);
    }
    exit;
}

// ── REMOVE: Gỡ mật khẩu (Tiêu chí 18) ──
if ($action === 'remove') {
    // Phải verify trước khi remove
    if ($note['note_password'] && !password_verify($password, $note['note_password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Mật khẩu không đúng']);
        exit;
    }
    $stmt = $pdo->prepare('UPDATE notes SET note_password = NULL WHERE id = ?');
    $stmt->execute([$noteId]);
    echo json_encode(['success' => true, 'message' => 'Đã gỡ mật khẩu']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Action không hợp lệ (set/verify/remove)']);
