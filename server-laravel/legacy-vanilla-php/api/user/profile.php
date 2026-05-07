<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT email, display_name, avatar, accent_color, preferences FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Người dùng không tồn tại']);
        exit;
    }
    
    $user['preferences'] = $user['preferences'] ? json_decode($user['preferences'], true) : [];
    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];
    
    if (isset($input['display_name'])) {
        $updates[] = 'display_name = ?';
        $params[] = trim($input['display_name']);
    }
    if (isset($input['avatar'])) {
        $updates[] = 'avatar = ?';
        $params[] = $input['avatar'];
    }
    if (isset($input['accent_color'])) {
        $updates[] = 'accent_color = ?';
        $params[] = $input['accent_color'];
    }
    if (isset($input['preferences'])) {
        $updates[] = 'preferences = ?';
        $params[] = json_encode($input['preferences']);
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Không có dữ liệu cập nhật']);
        exit;
    }
    
    $params[] = $userId;
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch updated user
    $stmt = $pdo->prepare('SELECT email, display_name, avatar, accent_color, preferences FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    $user['preferences'] = $user['preferences'] ? json_decode($user['preferences'], true) : [];
    
    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
