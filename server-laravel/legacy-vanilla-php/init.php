<?php
// Bật hiển thị lỗi để dễ debug trong lúc làm đồ án
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Sử dụng __DIR__ để lấy đường dẫn tuyệt đối của thư mục hiện tại.
// Điều này đảm bảo mã không bao giờ bị lỗi sai đường dẫn dù bạn gọi nó từ thư mục con nào.

// 1. Nạp các cấu hình hệ thống
require_once __DIR__ . '/config/cors.php'; // Xử lý lỗi chặn chéo nguồn
require_once __DIR__ . '/config/db.php';   // Khởi tạo biến $pdo kết nối MySQL

// 2. Nạp các hàm hỗ trợ (Helpers)
require_once __DIR__ . '/helpers/jwt.php'; 

// 3. Nạp Middleware kiểm tra quyền
require_once __DIR__ . '/middleware/auth.php';

// Sau khi nạp file này, bạn có thể dùng biến $pdo hoặc các hàm trong jwt.php ở bất kỳ đâu.
?>