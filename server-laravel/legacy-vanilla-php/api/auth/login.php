<?php
// api/auth/login.php — Đăng nhập (Tiêu chí 3)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng nhập email và mật khẩu']);
    exit;
}

// Tìm user
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Email hoặc mật khẩu không đúng']);
    exit;
}



// Tạo JWT token
$token = jwt_encode([
    'user_id' => $user['id'],
    'email'   => $user['email'],
]);

// Lưu session
$stmt = $pdo->prepare('INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([
    $user['id'],
    $token,
    $_SERVER['REMOTE_ADDR'] ?? '',
    $_SERVER['HTTP_USER_AGENT'] ?? '',
    date('Y-m-d H:i:s', time() + JWT_EXPIRY),
]);

// Trả kết quả (không trả password)
unset($user['password'], $user['activation_token'], $user['reset_token']);

echo json_encode([
    'success' => true,
    'token'   => $token,
    'user'    => $user,
]);
