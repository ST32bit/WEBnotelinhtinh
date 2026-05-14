<?php
// api/auth/forgot_password.php — Gửi link reset mật khẩu qua email (Tiêu chí 4)
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

// Tìm user theo email
$stmt = $pdo->prepare('SELECT id, display_name, is_active FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Luôn trả success (bảo mật — không tiết lộ email tồn tại hay không)
if (!$user || !$user['is_active']) {
    echo json_encode([
        'success' => true,
        'message' => 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.'
    ]);
    exit;
}

// Tạo reset token (Tiêu chí 4)
$resetToken  = bin2hex(random_bytes(32));
$resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $pdo->prepare('UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?');
$stmt->execute([$resetToken, $resetExpiry, $user['id']]);

// Gửi email reset (Tiêu chí 4)
$resetLink = "http://localhost:5173/reset-password?token=$resetToken";
$subject   = "Đặt lại mật khẩu NoteApp";
$message   = "Xin chào {$user['display_name']},\n\nBạn đã yêu cầu đặt lại mật khẩu.\nNhấn vào link sau:\n$resetLink\n\nLink có hiệu lực trong 1 giờ.\nNếu bạn không yêu cầu, hãy bỏ qua email này.";
$headers   = "From: noreply@noteapp.com\r\nContent-Type: text/plain; charset=utf-8";

@mail($email, $subject, $message, $headers);

echo json_encode([
    'success' => true,
    'message' => 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.'
]);
