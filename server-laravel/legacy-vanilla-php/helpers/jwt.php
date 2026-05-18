<?php
// helpers/jwt.php — JWT tự viết bằng PHP thuần (không cần thư viện)

define('JWT_SECRET', 'noteapp_secret_key_503073_change_this');
define('JWT_EXPIRY', 7 * 24 * 3600); // 7 ngày

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Tạo JWT token
 * @param array $payload — dữ liệu cần mã hóa (user_id, email, ...)
 * @return string — JWT token
 */
function jwt_encode($payload) {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

    // Thêm thời gian hết hạn
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $payloadEncoded = base64url_encode(json_encode($payload));

    $signature = base64url_encode(
        hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true)
    );

    return "$header.$payloadEncoded.$signature";
}

/**
 * Giải mã JWT token
 * @param string $token
 * @return array|false — payload nếu hợp lệ, false nếu không
 */
function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    [$header, $payload, $signature] = $parts;

    // Kiểm tra chữ ký
    $validSignature = base64url_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    );
    if (!hash_equals($validSignature, $signature)) return false;

    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return false;

    // Kiểm tra hết hạn
    if (isset($data['exp']) && $data['exp'] < time()) return false;

    return $data;
}
