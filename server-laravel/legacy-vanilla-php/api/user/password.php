<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $currentPassword = $input['current_password'] ?? '';
    $newPassword     = $input['new_password'] ?? '';
    
    if (!$currentPassword || !$newPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Vui lòng cung cấp mật khẩu cũ và mới']);
        exit;
    }
    
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($currentPassword, $user['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Mật khẩu hiện tại không đúng']);
        exit;
    }
    
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$hashedPassword, $userId]);
    
    echo json_encode(['success' => true, 'message' => 'Đổi mật khẩu thành công']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
