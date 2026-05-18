<?php
// api/auth/logout.php — Đăng xuất, xóa session (Tiêu chí 3)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$auth = authenticate();

// Lấy token hiện tại từ header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = substr($authHeader, 7);

// Xóa session khỏi DB (Tiêu chí 3)
$stmt = $pdo->prepare('DELETE FROM user_sessions WHERE user_id = ? AND token = ?');
$stmt->execute([$auth['user_id'], $token]);

echo json_encode([
    'success' => true,
    'message' => 'Đăng xuất thành công'
]);
