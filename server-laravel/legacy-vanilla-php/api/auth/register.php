<?php
// api/auth/register.php — Đăng ký tài khoản (Tiêu chí 1 + 2)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email       = trim($input['email'] ?? '');
$displayName = trim($input['displayName'] ?? '');
$password    = $input['password'] ?? '';
$confirmPass = $input['confirmPassword'] ?? '';

// Validate
if (!$email || !$displayName || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Vui lòng điền đầy đủ thông tin']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email không hợp lệ']);
    exit;
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Mật khẩu phải có ít nhất 6 ký tự']);
    exit;
}
if ($password !== $confirmPass) {
    http_response_code(400);
    echo json_encode(['error' => 'Mật khẩu nhập lại không khớp']);
    exit;
}

// Kiểm tra email đã tồn tại
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email đã được sử dụng']);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Tạo activation token (Tiêu chí 2 — kích hoạt qua email)
$activationToken  = bin2hex(random_bytes(32));
$activationExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

// Insert user
$stmt = $pdo->prepare('
    INSERT INTO users (email, display_name, password, is_active, activation_token, activation_expiry)
    VALUES (?, ?, ?, 0, ?, ?)
');
$stmt->execute([$email, $displayName, $hashedPassword, $activationToken, $activationExpiry]);
$userId = $pdo->lastInsertId();

// Auto-login (Create JWT token)
$token = jwt_encode([
    'user_id' => $userId,
    'email'   => $email,
]);

// Save session
$stmt = $pdo->prepare('INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([
    $userId,
    $token,
    $_SERVER['REMOTE_ADDR'] ?? '',
    $_SERVER['HTTP_USER_AGENT'] ?? '',
    date('Y-m-d H:i:s', time() + JWT_EXPIRY),
]);

// Tạo link kích hoạt (Tiêu chí 2)
$activationLink = "http://localhost:8000/api/auth/activate.php?token=$activationToken";
$subject = "Kích hoạt tài khoản NoteApp";
$message = "Xin chào $displayName,\n\nNhấn vào link sau để kích hoạt tài khoản:\n$activationLink\n\nLink có hiệu lực trong 24 giờ.";
$headers = "From: noreply@noteapp.com\r\nContent-Type: text/plain; charset=utf-8";

// mail() — cần cấu hình SMTP trong php.ini hoặc dùng XAMPP sendmail
@mail($email, $subject, $message, $headers);

echo json_encode([
    'success'         => true,
    'message'         => 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
    'activation_link' => $activationLink,  // Trả về cho môi trường local demo
    'token'           => $token,
    'user'            => [
        'id'           => $userId,
        'email'        => $email,
        'display_name' => $displayName,
        'is_active'    => 0,
        'avatar'       => null,
        'accent_color' => 'from-indigo-500 to-violet-600'
    ]
]);
