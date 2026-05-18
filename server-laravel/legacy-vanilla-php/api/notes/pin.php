<?php
// api/notes/pin.php — Ghim / Bỏ ghim note (Tiêu chí 17)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth   = authenticate();
$userId = $auth['user_id'];
$input  = json_decode(file_get_contents('php://input'), true);
$noteId = intval($input['note_id'] ?? 0);

if (!$noteId) {
    http_response_code(400);
    echo json_encode(['error' => 'note_id là bắt buộc']);
    exit;
}

// Verify ownership
$stmt = $pdo->prepare('SELECT id, is_pinned FROM notes WHERE id = ? AND user_id = ?');
$stmt->execute([$noteId, $userId]);
$note = $stmt->fetch();

if (!$note) {
    http_response_code(403);
    echo json_encode(['error' => 'Không có quyền']);
    exit;
}

// Toggle pin (Tiêu chí 17)
$newPinned = $note['is_pinned'] ? 0 : 1;
$stmt = $pdo->prepare('UPDATE notes SET is_pinned = ? WHERE id = ?');
$stmt->execute([$newPinned, $noteId]);

echo json_encode([
    'success'   => true,
    'is_pinned' => (bool)$newPinned,
    'message'   => $newPinned ? 'Đã ghim note' : 'Đã bỏ ghim note'
]);
