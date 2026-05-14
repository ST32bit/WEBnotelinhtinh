<?php
// api/auth/change_password.php — Đổi mật khẩu (Tiêu chí 7)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth = authenticate();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$currentPassword = $input['currentPassword'] ?? '';
$newPassword     = $input['newPassword'] ?? '';

if (!$currentPassword || !$newPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng nhập đủ mật khẩu cũ và mới']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Mật khẩu mới phải có ít nhất 6 ký tự']);
    exit;
}

// Verify current password
$stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Mật khẩu hiện tại không đúng']);
    exit;
}

// Update password
$hashed = password_hash($newPassword, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
$stmt->execute([$hashed, $userId]);

echo json_encode(['success' => true, 'message' => 'Đổi mật khẩu thành công']);
