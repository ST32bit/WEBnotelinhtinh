<?php
// api/users/preferences.php — Tùy chọn người dùng (Tiêu chí 8)
// Lưu/đọc settings: theme, showHolidays, showLabels...
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Đọc preferences (Tiêu chí 8) ──
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT preferences FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    $prefs = $row && $row['preferences'] ? json_decode($row['preferences'], true) : [
        'theme' => 'light',
        'showVietnameseHolidays' => true,
        'showInternationalHolidays' => true,
        'showLunarHolidays' => true,
        'showTet' => true,
    ];

    echo json_encode(['success' => true, 'preferences' => $prefs]);
    exit;
}

// ── PUT: Cập nhật preferences (Tiêu chí 8) ──
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dữ liệu preferences không hợp lệ']);
        exit;
    }

    // Whitelist các key được phép
    $allowed = ['theme', 'showVietnameseHolidays', 'showInternationalHolidays',
                'showLunarHolidays', 'showTet', 'showLabels'];
    $filtered = array_intersect_key($input, array_flip($allowed));

    // Merge với preferences hiện tại
    $stmt = $pdo->prepare('SELECT preferences FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    $current = $row && $row['preferences'] ? json_decode($row['preferences'], true) : [];
    $merged = array_merge($current, $filtered);

    $stmt = $pdo->prepare('UPDATE users SET preferences = ? WHERE id = ?');
    $stmt->execute([json_encode($merged), $userId]);

    echo json_encode(['success' => true, 'preferences' => $merged]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
