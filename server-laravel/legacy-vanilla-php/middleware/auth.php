<?php
// middleware/auth.php — Xác thực JWT từ Authorization header

require_once __DIR__ . '/../helpers/jwt.php';

/**
 * Xác thực user từ JWT token trong header
 * Trả về user_id nếu hợp lệ, response 401 nếu không
 */
function authenticate() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token không được cung cấp']);
        exit;
    }

    $token = substr($authHeader, 7);
    $payload = jwt_decode($token);

    if (!$payload || !isset($payload['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Token không hợp lệ hoặc đã hết hạn']);
        exit;
    }

    return $payload;
}
