<?php
// api/notes/poll.php — Polling endpoint cho real-time (Tiêu chí 21 + 26)
// Frontend gọi mỗi 3s để lấy notes đã thay đổi
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth   = authenticate();
$userId = $auth['user_id'];
$since  = $_GET['since'] ?? date('Y-m-d H:i:s', strtotime('-10 seconds'));

// Notes của user thay đổi sau timestamp
$stmt = $pdo->prepare('
    SELECT n.* FROM notes n
    WHERE n.user_id = ? AND n.updated_at > ?
    ORDER BY n.updated_at DESC
');
$stmt->execute([$userId, $since]);
$changed = $stmt->fetchAll();

// Notes được chia sẻ thay đổi (Tiêu chí 26)
$stmt = $pdo->prepare('
    SELECT n.*, sn.role FROM notes n
    INNER JOIN shared_notes sn ON sn.note_id = n.id
    WHERE sn.shared_with = ? AND n.updated_at > ?
');
$stmt->execute([$userId, $since]);
$sharedChanged = $stmt->fetchAll();

echo json_encode([
    'success'        => true,
    'changed_notes'  => $changed,
    'shared_changed' => $sharedChanged,
    'server_time'    => date('Y-m-d H:i:s'),
]);
