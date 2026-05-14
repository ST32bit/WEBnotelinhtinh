<?php
// api/auth/activate.php — Kích hoạt tài khoản qua email link (Tiêu chí 2)
require_once __DIR__ . '/../../config/db.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    http_response_code(400);
    echo '<h2>❌ Token không hợp lệ</h2>';
    exit;
}

$stmt = $pdo->prepare('SELECT id, is_active, activation_expiry FROM users WHERE activation_token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    echo '<h2>❌ Token không tồn tại hoặc đã được sử dụng</h2>';
    exit;
}

if ($user['is_active']) {
    echo '<h2>✅ Tài khoản đã được kích hoạt trước đó</h2>';
    exit;
}

if (strtotime($user['activation_expiry']) < time()) {
    echo '<h2>⏰ Token đã hết hạn. Vui lòng đăng ký lại.</h2>';
    exit;
}

// Kích hoạt tài khoản
$stmt = $pdo->prepare('UPDATE users SET is_active = 1, activation_token = NULL WHERE id = ?');
$stmt->execute([$user['id']]);

echo '<h2>✅ Kích hoạt tài khoản thành công!</h2><p>Bạn có thể <a href="http://localhost:5173/login">đăng nhập</a> ngay bây giờ.</p>';
