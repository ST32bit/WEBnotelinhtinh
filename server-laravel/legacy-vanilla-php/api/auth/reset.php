<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? '';
$password = $input['password'] ?? '';

if (!$token || !$password || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng cung cấp token và mật khẩu mới (ít nhất 6 ký tự)']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, reset_expiry FROM users WHERE reset_token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(400);
    echo json_encode(['error' => 'Token không hợp lệ hoặc không tồn tại']);
    exit;
}

if (strtotime($user['reset_expiry']) < time()) {
    http_response_code(400);
    echo json_encode(['error' => 'Link khôi phục đã hết hạn']);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?');
$stmt->execute([$hashedPassword, $user['id']]);

echo json_encode(['success' => true, 'message' => 'Đặt lại mật khẩu thành công']);
