<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email không hợp lệ']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, display_name FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'Email không tồn tại trong hệ thống']);
    exit;
}

$resetToken  = bin2hex(random_bytes(32));
$resetExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

$stmt = $pdo->prepare('UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?');
$stmt->execute([$resetToken, $resetExpiry, $user['id']]);

$resetLink = "http://localhost:5173/reset-password?token=$resetToken";

echo json_encode([
    'success' => true,
    'message' => 'Link khôi phục mật khẩu đã được tạo!',
    'reset_link' => $resetLink // Dùng cho local demo
]);
