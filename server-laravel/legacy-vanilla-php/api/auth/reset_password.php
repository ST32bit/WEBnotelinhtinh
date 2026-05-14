<?php
// api/auth/reset_password.php — Đặt lại mật khẩu bằng token (Tiêu chí 4)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input       = json_decode(file_get_contents('php://input'), true);
$token       = trim($input['token'] ?? '');
$newPassword = $input['newPassword'] ?? '';

if (!$token || !$newPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'Token và mật khẩu mới là bắt buộc']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Mật khẩu mới phải có ít nhất 6 ký tự']);
    exit;
}

// Tìm user theo reset token
$stmt = $pdo->prepare('SELECT id, reset_expiry FROM users WHERE reset_token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(400);
    echo json_encode(['error' => 'Token không hợp lệ hoặc đã được sử dụng']);
    exit;
}

if (strtotime($user['reset_expiry']) < time()) {
    http_response_code(400);
    echo json_encode(['error' => 'Token đã hết hạn. Vui lòng yêu cầu lại.']);
    exit;
}

// Đổi mật khẩu + xóa token (Tiêu chí 4)
$hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?');
$stmt->execute([$hashedPassword, $user['id']]);

echo json_encode([
    'success' => true,
    'message' => 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.'
]);
