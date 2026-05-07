<?php
/**
 * ╔══════════════════════════════════════════════╗
 * ║  PHPMailer — Standalone SMTP Test Script     ║
 * ║  Chạy: php test_mail.php                     ║
 * ║  Xóa file này sau khi test xong!             ║
 * ╚══════════════════════════════════════════════╝
 */

require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// ═══════════════════════════════════════
// CẤU HÌNH — Sửa trực tiếp ở đây để test
// ═══════════════════════════════════════
$config = [
    'smtp_host'     => 'smtp.gmail.com',
    'smtp_port'     => 587,
    'smtp_username' => '52400151@student.tdtu.edu.vn',      // ← SỬA: Email Gmail thật của bạn
    'smtp_password' => 'gafo vssg bbua pytj',            // ← SỬA: Mật khẩu ứng dụng 16 ký tự
    'from_email'    => '52400151@student.tdtu.edu.vn',      // ← SỬA: Phải trùng với smtp_username
    'from_name'     => 'NoteApp Test',
    'to_email'      => 'thanhlan1248@gmail.com',      // ← SỬA: Email nhận (gửi cho chính mình để test)
];

echo "╔══════════════════════════════════════════╗\n";
echo "║  PHPMailer SMTP Diagnostic Tool          ║\n";
echo "╚══════════════════════════════════════════╝\n\n";

// ── Step 1: Kiểm tra PHPMailer đã load ──
echo "[1/5] Kiểm tra PHPMailer class... ";
if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    echo "✅ OK\n";
} else {
    echo "❌ FAIL — Chưa cài PHPMailer. Chạy: composer require phpmailer/phpmailer\n";
    exit(1);
}

// ── Step 2: Kiểm tra OpenSSL extension ──
echo "[2/5] Kiểm tra OpenSSL extension... ";
if (extension_loaded('openssl')) {
    echo "✅ OK\n";
} else {
    echo "❌ FAIL — Bật openssl trong php.ini (Laragon: Menu > PHP > Extensions > openssl)\n";
    exit(1);
}

// ── Step 3: Kiểm tra kết nối đến SMTP server ──
echo "[3/5] Kiểm tra kết nối đến {$config['smtp_host']}:{$config['smtp_port']}... ";
$conn = @fsockopen($config['smtp_host'], $config['smtp_port'], $errno, $errstr, 10);
if ($conn) {
    echo "✅ OK\n";
    fclose($conn);
} else {
    echo "❌ FAIL — Không kết nối được: {$errstr} (#{$errno})\n";
    echo "   → Kiểm tra tường lửa Windows hoặc thử Port 465 với SSL\n";
    exit(1);
}

// ── Step 4: Kiểm tra credentials ──
echo "[4/5] Kiểm tra thông tin đăng nhập...\n";
if (strpos($config['smtp_username'], 'YOUR_REAL') !== false || strpos($config['smtp_username'], 'your-email') !== false) {
    echo "   ❌ BẠN CHƯA SỬA EMAIL TRONG FILE NÀY!\n";
    echo "   → Mở file test_mail.php, tìm dòng 'smtp_username' và thay bằng email Gmail thật.\n";
    exit(1);
}
if (strpos($config['smtp_password'], 'xxxx') !== false || strpos($config['smtp_password'], 'your-app') !== false) {
    echo "   ❌ BẠN CHƯA SỬA MẬT KHẨU TRONG FILE NÀY!\n";
    echo "   → Thay 'smtp_password' bằng Mật khẩu ứng dụng Google (16 ký tự).\n";
    exit(1);
}
echo "   Username: {$config['smtp_username']}\n";
echo "   Password: " . str_repeat('*', strlen($config['smtp_password'])) . " (" . strlen($config['smtp_password']) . " chars)\n";

// ── Step 5: GỬI THỬ EMAIL ──
echo "[5/5] Đang gửi email thử...\n\n";

$mail = new PHPMailer(true);

try {
    // Bật DEBUG cấp cao nhất để thấy toàn bộ giao tiếp SMTP
    $mail->SMTPDebug  = SMTP::DEBUG_SERVER;  // Hiện toàn bộ log SMTP
    $mail->Debugoutput = function($str, $level) {
        echo "   [SMTP] $str\n";
    };

    $mail->CharSet    = 'UTF-8';
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_username'];
    $mail->Password   = $config['smtp_password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;  // Đúng constant
    $mail->Port       = (int) $config['smtp_port'];

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email']);

    $mail->isHTML(true);
    $mail->Subject = '[NoteApp Test] Email gửi thành công!';
    $mail->Body    = '<h2>✅ PHPMailer hoạt động!</h2><p>Nếu bạn nhận được email này, PHPMailer đã cấu hình đúng.</p><p>Thời gian: ' . date('Y-m-d H:i:s') . '</p>';
    $mail->AltBody = 'PHPMailer hoạt động! Thời gian: ' . date('Y-m-d H:i:s');

    $mail->send();

    echo "\n╔══════════════════════════════════════════╗\n";
    echo "║  ✅ GỬI EMAIL THÀNH CÔNG!                ║\n";
    echo "║  Kiểm tra hộp thư {$config['to_email']}  \n";
    echo "╚══════════════════════════════════════════╝\n";

} catch (Exception $e) {
    echo "\n╔══════════════════════════════════════════╗\n";
    echo "║  ❌ GỬI EMAIL THẤT BẠI                   ║\n";
    echo "╚══════════════════════════════════════════╝\n";
    echo "Lỗi PHPMailer: {$mail->ErrorInfo}\n";
    echo "Exception: {$e->getMessage()}\n\n";

    // Gợi ý sửa lỗi
    if (strpos($mail->ErrorInfo, 'authenticate') !== false || strpos($mail->ErrorInfo, 'credentials') !== false) {
        echo "💡 GỢI Ý: Sai Username hoặc Password.\n";
        echo "   → Đảm bảo dùng Mật khẩu ứng dụng (App Password), KHÔNG phải mật khẩu Gmail.\n";
        echo "   → Tạo tại: https://myaccount.google.com/apppasswords\n";
    } elseif (strpos($mail->ErrorInfo, 'connect') !== false) {
        echo "💡 GỢI Ý: Không kết nối được SMTP server.\n";
        echo "   → Thử đổi Port sang 465 và SMTPSecure sang 'ssl'\n";
        echo "   → Kiểm tra tường lửa Windows Firewall\n";
    } elseif (strpos($mail->ErrorInfo, 'certificate') !== false || strpos($mail->ErrorInfo, 'SSL') !== false) {
        echo "💡 GỢI Ý: Lỗi SSL/TLS certificate.\n";
        echo "   → Bật extension openssl trong php.ini\n";
    }
}

echo "\n⚠️  NHỚ XÓA FILE NÀY SAU KHI TEST XONG (chứa mật khẩu)!\n";
