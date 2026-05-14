<?php
// api/notes/share.php — Chia sẻ note (Tiêu chí 25)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Lấy danh sách note được chia sẻ với tôi ──
if ($method === 'GET') {
    $stmt = $pdo->prepare('
        SELECT n.*, sn.role, u.display_name as owner_name, u.email as owner_email
        FROM shared_notes sn
        INNER JOIN notes n ON n.id = sn.note_id
        INNER JOIN users u ON u.id = sn.owner_id
        WHERE sn.shared_with = ?
        ORDER BY sn.created_at DESC
    ');
    $stmt->execute([$userId]);
    echo json_encode(['success' => true, 'notes' => $stmt->fetchAll()]);
    exit;
}

// ── POST: Chia sẻ note (Tiêu chí 25) ──
if ($method === 'POST') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $noteId = intval($input['note_id'] ?? 0);
    $email  = trim($input['email'] ?? '');
    $role   = $input['role'] ?? 'viewer';

    if (!$noteId || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'note_id và email bắt buộc']);
        exit;
    }
    if (!in_array($role, ['viewer', 'editor'])) $role = 'viewer';

    // Verify ownership
    $stmt = $pdo->prepare('SELECT id FROM notes WHERE id=? AND user_id=?');
    $stmt->execute([$noteId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Không có quyền']);
        exit;
    }

    // Find target user by email
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email=?');
    $stmt->execute([$email]);
    $target = $stmt->fetch();
    if (!$target) {
        http_response_code(404);
        echo json_encode(['error' => 'Người dùng với email này chưa đăng ký']);
        exit;
    }
    if ($target['id'] == $userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Không thể chia sẻ với chính mình']);
        exit;
    }

    $stmt = $pdo->prepare('
        INSERT INTO shared_notes (note_id, owner_id, shared_with, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE role = VALUES(role)
    ');
    $stmt->execute([$noteId, $userId, $target['id'], $role]);

    echo json_encode(['success' => true, 'message' => "Đã chia sẻ với $email"]);
    exit;
}

// ── DELETE: Hủy chia sẻ ──
if ($method === 'DELETE') {
    $noteId = intval($_GET['note_id'] ?? 0);
    $sharedWith = intval($_GET['shared_with'] ?? 0);

    if (!$noteId || !$sharedWith) {
        http_response_code(400);
        echo json_encode(['error' => 'Thiếu tham số']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM shared_notes WHERE note_id=? AND owner_id=? AND shared_with=?');
    $stmt->execute([$noteId, $userId, $sharedWith]);

    echo json_encode(['success' => true, 'message' => 'Đã hủy chia sẻ']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
