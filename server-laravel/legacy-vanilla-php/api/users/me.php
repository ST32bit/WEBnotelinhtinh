<?php
// api/users/me.php — Xem + Chỉnh sửa profile (Tiêu chí 5 + 6)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Xem profile (Tiêu chí 5) ──
if ($method === 'GET') {
    $stmt = $pdo->prepare('
        SELECT id, email, username, display_name, avatar, bio, accent_color, preferences, created_at
        FROM users WHERE id = ?
    ');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User không tồn tại']);
        exit;
    }

    // Decode preferences JSON
    $user['preferences'] = $user['preferences'] ? json_decode($user['preferences'], true) : null;

    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

// ── PUT: Chỉnh sửa profile (Tiêu chí 6) ──
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    $displayName = trim($input['display_name'] ?? '');
    $bio         = trim($input['bio'] ?? '');
    $avatar      = $input['avatar'] ?? null;      // URL hoặc base64
    $accentColor = $input['accent_color'] ?? null;

    if (!$displayName) {
        http_response_code(400);
        echo json_encode(['error' => 'Tên hiển thị không được để trống']);
        exit;
    }

    // Xây dựng câu UPDATE động
    $fields = ['display_name = ?', 'bio = ?'];
    $params = [$displayName, $bio];

    if ($avatar !== null) {
        $fields[] = 'avatar = ?';
        $params[] = $avatar;
    }
    if ($accentColor !== null) {
        $fields[] = 'accent_color = ?';
        $params[] = $accentColor;
    }

    $params[] = $userId;
    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Trả lại profile đã cập nhật
    $stmt = $pdo->prepare('
        SELECT id, email, username, display_name, avatar, bio, accent_color, preferences, created_at
        FROM users WHERE id = ?
    ');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    $user['preferences'] = $user['preferences'] ? json_decode($user['preferences'], true) : null;

    echo json_encode(['success' => true, 'user' => $user]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
