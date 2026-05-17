================================================================================
  NOTEAPP - DỰ ÁN CUỐI KỲ 503073
  Ứng dụng Ghi chú Full-Stack
================================================================================

THÔNG TIN NHÓM
--------------
[Điền tên và MSSV các thành viên vào đây]

Tên thư mục nộp: mssv1_hoten1_mssv2_hoten2/
Tên file ZIP   : mssv1_hoten1_mssv2_hoten2.zip


================================================================================
  TỔNG QUAN DỰ ÁN
================================================================================

NoteApp là ứng dụng ghi chú full-stack hoàn chỉnh, triển khai bằng Docker
Compose, hỗ trợ đầy đủ 28 tiêu chí đánh giá của môn học.

Công nghệ sử dụng:
  - Frontend  : React 19 + Vite + TailwindCSS 3
  - Backend   : Laravel 11 (PHP 8.2) - RESTful API
  - Cơ sở dữ liệu: MySQL 8.0
  - Real-time : Socket.IO (Node.js WebSocket)
  - Xác thực  : Laravel Sanctum (token-based)
  - Email     : PHPMailer qua Gmail SMTP (email thật)
  - Triển khai: Docker Compose (4 containers)


================================================================================
  HƯỚNG DẪN CHẠY ỨNG DỤNG (DOCKER COMPOSE)
================================================================================

YÊU CẦU TRƯỚC KHI CHẠY:
  - Đã cài đặt Docker Desktop và đang chạy
  - Các cổng sau chưa được sử dụng:
      5173  (Frontend)
      8000  (Backend API)
      3001  (WebSocket)
      3306  (MySQL)
      8080  (phpMyAdmin)

CÁC BƯỚC THỰC HIỆN:

  Bước 1: Giải nén file ZIP vào một thư mục bất kỳ trên máy tính.

  Bước 2: Mở terminal (Command Prompt / PowerShell / Terminal) tại thư mục đó.
           - Windows: Click chuột phải vào thư mục -> "Open in Terminal"
           - Mac/Linux: Mở Terminal, dùng lệnh cd đến thư mục

  Bước 3: Khởi động toàn bộ hệ thống bằng lệnh:

             docker compose up -d --build

           Chờ khoảng 60 giây để tất cả dịch vụ khởi động xong.

  Bước 4: Chạy migration cơ sở dữ liệu (CHỈ CẦN CHẠY LẦN ĐẦU):

             docker exec www-backend-1 php artisan migrate --force

  Bước 5: Mở trình duyệt và truy cập:

             http://localhost:5173

  Ứng dụng đã sẵn sàng để sử dụng và đánh giá!

CÁC LỆNH HỮU ÍCH:
  Dừng tất cả dịch vụ  : docker compose down
  Xem logs             : docker compose logs -f
  Kiểm tra trạng thái  : docker compose ps
  Khởi động lại service: docker compose restart backend

ĐỊA CHỈ TRUY CẬP:
  Ứng dụng chính  -> http://localhost:5173
  API Backend     -> http://localhost:8000/api
  phpMyAdmin (DB) -> http://localhost:8080  (user: root | pass: root)


================================================================================
  TÀI KHOẢN DEMO (CÓ SẴN DỮ LIỆU MẪU)
================================================================================

Tài khoản sau đã được tạo sẵn với dữ liệu mẫu (ghi chú, nhãn, chia sẻ):

  Email    : demo@noteapp.com
  Mật khẩu : password

CÁCH TẠO TÀI KHOẢN MỚI ĐỂ TEST:
  1. Truy cập http://localhost:5173/register
  2. Điền: Tên hiển thị, Username, Email, Mật khẩu (nhập 2 lần)
  3. Kiểm tra hộp thư email để nhấn vào link kích hoạt
  4. Sau khi kích hoạt, đăng nhập bình thường

  Lưu ý: Tài khoản chưa kích hoạt qua email sẽ KHÔNG thể đăng nhập.


================================================================================
  LƯU Ý VỀ HỆ THỐNG EMAIL
================================================================================

Ứng dụng gửi email thật qua Gmail SMTP trong các trường hợp:
  - Kích hoạt tài khoản sau khi đăng ký
  - Đặt lại mật khẩu (Forgot Password)
  - Thông báo cho người nhận khi có note được chia sẻ

Cấu hình email nằm trong file: server-laravel/.env
Tài khoản gửi: nguyentrongquoc11062006@gmail.com

Nếu không nhận được email: kiểm tra hòm thư Spam / Junk.


================================================================================
  HƯỚNG DẪN SỬ DỤNG CÁC TÍNH NĂNG CHÍNH
================================================================================

TẠO VÀ CHỈNH SỬA GHI CHÚ:
  - Nhấn nút "+ Ghi chú mới" để tạo ghi chú
  - Nhập tiêu đề và nội dung - tự động lưu sau 600ms (không cần nút Lưu)
  - Trên mỗi thẻ ghi chú có các nút: Ghim, Sửa, Nhãn, Chia sẻ, Khóa, Xóa

CHẾ ĐỘ HIỂN THỊ:
  - Chuyển đổi giữa Grid (lưới) và List (danh sách) bằng icon góc trên phải
  - Mặc định là chế độ Grid

TÌM KIẾM:
  - Gõ vào ô tìm kiếm - kết quả hiện sau 300ms (không có nút Tìm kiếm)
  - Tìm kiếm đồng thời trên cả tiêu đề và nội dung

NHÃN (LABELS):
  - Nhấn icon nhãn trên thẻ ghi chú để gắn nhãn
  - Nhấn icon bánh răng (⚙️) trong bảng nhãn để quản lý (thêm/sửa/xóa nhãn)
  - Nhấn tên nhãn trên sidebar để lọc ghi chú theo nhãn đó

GHIM GHI CHÚ:
  - Nhấn icon ghim - ghi chú được ghim luôn hiển thị trên cùng

KHÓA MẬT KHẨU:
  - Nhấn icon khóa để đặt mật khẩu cho ghi chú (nhập 2 lần)
  - Ghi chú đã khóa sẽ tự khóa lại sau khi tải lại trang
  - Ghi chú đang khóa KHÔNG THỂ chia sẻ - phải mở khóa trước
  - Gỡ mật khẩu yêu cầu nhập mật khẩu hiện tại để xác nhận

CHIA SẺ GHI CHÚ:
  - Mở khóa ghi chú trước (nếu có mật khẩu)
  - Nhấn icon chia sẻ (🔗) trên thẻ ghi chú
  - Nhập email người nhận (phải là tài khoản đã đăng ký và kích hoạt)
  - Chọn quyền: Xem (read-only) hoặc Sửa (có thể chỉnh nội dung)
  - Nhấn Lưu - người nhận sẽ nhận email thông báo tự động
  - Người nhận vào tab "Đã chia sẻ" -> "Được chia sẻ với tôi" để xem

CỘNG TÁC THỜI GIAN THỰC:
  - Mở cùng một ghi chú trên hai tài khoản khác nhau cùng lúc
  - Chỉnh sửa của một bên xuất hiện ngay lập tức ở bên kia (WebSocket)

CHẾ ĐỘ TỐI / SÁNG (DARK MODE):
  - Nhấn icon mặt trăng/mặt trời ở góc trên phải

HỒ SƠ CÁ NHÂN:
  - Nhấn vào avatar ở sidebar để vào trang hồ sơ
  - Chỉnh tên hiển thị, tiểu sử, ảnh đại diện, màu chủ đạo
  - Đổi mật khẩu tài khoản (yêu cầu nhập mật khẩu hiện tại)

ĐÍNH KÈM ẢNH:
  - Mở ghi chú để sửa, nhấn icon đính kèm để upload ảnh
  - Ảnh được lưu trên server và hiển thị preview trong ghi chú

PWA / CHẾ ĐỘ OFFLINE:
  - Ứng dụng có thể cài đặt như một PWA (Progressive Web App)
  - Khi mất mạng, dữ liệu đã tải trước đó vẫn có thể xem được


================================================================================
  CÔNG NGHỆ & KIẾN TRÚC
================================================================================

FRONTEND (frontend-react/):
  - Framework  : React 19 với Vite
  - CSS        : TailwindCSS 3
  - Real-time  : Socket.IO client (port 3001)
  - PWA        : manifest.json + Service Worker (sw.js)
  - Trang chính: Home.jsx, User.jsx, Login/Register/ForgotPassword

BACKEND (server-laravel/):
  - Framework  : Laravel 11 (PHP 8.2)
  - Xác thực   : Laravel Sanctum
  - ORM        : Eloquent với MySQL
  - Email      : PHPMailer
  - API style  : RESTful (routes/api.php)

WEBSOCKET (websocket-server/):
  - Runtime    : Node.js
  - Thư viện   : Socket.IO
  - Events     : join-note, leave-note, edit-note, note-updated
  - Pattern    : Room theo note ID

CƠ SỞ DỮ LIỆU (7 bảng):
  - users                 : tài khoản, token, tùy chọn
  - personal_access_tokens: token đăng nhập Sanctum
  - notes                 : nội dung, ghim, hash mật khẩu
  - labels                : nhãn tùy chỉnh của người dùng
  - note_labels           : bảng trung gian (notes <-> labels)
  - note_attachments      : metadata file đính kèm
  - shared_notes          : quan hệ chia sẻ + quyền truy cập


================================================================================
  CẤU TRÚC THƯ MỤC DỰ ÁN
================================================================================

www/
|-- docker-compose.yml          <- Chạy toàn bộ hệ thống bằng 1 lệnh
|-- readme.txt                  <- File này
|-- README.md                   <- Tài liệu kỹ thuật (hiển thị trên GitHub)
|-- frontend-react/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- Home.jsx        <- App chính (ghi chú, lịch, chia sẻ)
|   |   |   |-- User.jsx        <- Hồ sơ & đổi mật khẩu
|   |   |   |-- Login.jsx
|   |   |   |-- Register.jsx    <- Form đăng ký có field Username
|   |   |   |-- ForgotPassword.jsx
|   |   |   `-- ResetPassword.jsx
|   |   `-- api.js              <- Client gọi API tập trung
|   `-- public/
|       |-- manifest.json       <- Cấu hình PWA
|       `-- sw.js               <- Service Worker (offline)
|-- server-laravel/
|   |-- app/Http/Controllers/
|   |   |-- AuthController.php       <- Đăng ký, đăng nhập, reset
|   |   |-- NoteController.php       <- CRUD, tìm kiếm, ghim, khóa
|   |   |-- NoteShareController.php  <- Chia sẻ, thông báo, poll
|   |   |-- LabelController.php      <- CRUD nhãn
|   |   |-- UserController.php       <- Hồ sơ, tùy chọn
|   |   `-- NoteAttachmentController.php <- Upload file
|   |-- routes/api.php          <- 30+ API endpoints
|   `-- .env                    <- Cấu hình DB & Email
`-- websocket-server/
    `-- server.js               <- Server Socket.IO


================================================================================
  TỰ ĐÁNH GIÁ - 28 TIÊU CHÍ
================================================================================

QUẢN LÝ TÀI KHOẢN:
  [x]  1. Đăng ký - email, username, tên hiển thị, mật khẩu x2
  [x]  2. Kích hoạt tài khoản qua email (PHPMailer - gửi email thật)
  [x]  3. Đăng nhập / Đăng xuất (Sanctum token)
  [x]  4. Đặt lại mật khẩu qua email (link token bảo mật)
  [x]  5. Xem hồ sơ và avatar
  [x]  6. Chỉnh sửa hồ sơ và avatar (upload ảnh thật)
  [x]  7. Đổi mật khẩu (yêu cầu nhập mật khẩu hiện tại)
  [x]  8. Tùy chọn người dùng (dark/light mode, font, màu mặc định)

QUẢN LÝ GHI CHÚ CƠ BẢN:
  [x]  9. Hiển thị dạng List View
  [x] 10. Hiển thị dạng Grid View
  [x] 11. Tạo ghi chú (chỉ tiêu đề + nội dung, đúng yêu cầu đề)
  [x] 12. Cập nhật ghi chú (dùng chung giao diện với tạo)
  [x] 13. Xóa ghi chú (có hộp thoại xác nhận)
  [x] 14. Tự động lưu debounced 600ms (không cần nút Lưu)
  [x] 15. Đính kèm ảnh vào ghi chú (lưu thật trên server)
  [x] 16. Ghim ghi chú lên đầu (sắp xếp phía server)
  [x] 17. Tìm kiếm debounced 300ms, toàn văn bản, không nút Search
  [x] 18. Quản lý nhãn CRUD (tạo, sửa màu, xóa, đồng bộ DB)
  [x] 19. Gắn nhãn vào ghi chú (hỗ trợ nhiều nhãn cùng lúc)
  [x] 20. Lọc ghi chú theo nhãn
  [x] 21. Bật/Tắt mật khẩu ghi chú (yêu cầu xác nhận mật khẩu hiện tại)
  [x] 22. Bảo vệ mật khẩu, đổi mật khẩu (mật khẩu cũ + mật khẩu mới x2)

TÍNH NĂNG NÂNG CAO:
  [x] 23. Chia sẻ và nhận ghi chú (validate email + gửi email thông báo)
  [x] 24. Cộng tác và chỉnh sửa thời gian thực (WebSocket Socket.IO)
  [x] 25. Giao diện và trải nghiệm người dùng (animation, dark mode, toast)
  [x] 26. Responsive (mobile và tablet)
  [x] 27. Offline PWA (Service Worker caching)
  [x] 28. Triển khai Docker Compose (4 containers, 1 lệnh duy nhất)

ĐIỂM NỔI BẬT "BETTER APPROACH":
  - Gửi email thật cho người nhận khi có ghi chú được chia sẻ
  - Đổi mật khẩu ghi chú: nhập mật khẩu cũ + mật khẩu mới 2 lần
  - Ghi chú đang khóa KHÔNG được chia sẻ cho đến khi mở khóa
  - Real-time qua WebSocket (không chỉ polling) - thay đổi hiện ngay lập tức
  - Ghi chú chưa đọc hiển thị badge thông báo khi đăng nhập
  - Form đăng ký có field Username riêng biệt (không tự sinh từ email)


================================================================================
  XỬ LÝ LỖI THƯỜNG GẶP
================================================================================

Lỗi: "Port already in use"
Cách xử lý: Đóng ứng dụng đang dùng cổng 5173, 8000, 3001 hoặc 3306.
             Hoặc sửa mapping cổng trong file docker-compose.yml.

Lỗi: Backend không kết nối được database
Cách xử lý: Chờ thêm 30 giây để MySQL khởi động, sau đó chạy lại:
             docker exec www-backend-1 php artisan migrate --force

Lỗi: Không nhận được email
Cách xử lý: Kiểm tra hòm thư Spam/Junk.
             Email gửi từ: nguyentrongquoc11062006@gmail.com
             Lỗi email được ghi log nhưng không làm crash ứng dụng.

Lỗi: Frontend hiển thị cảnh báo "Offline"
Cách xử lý: Backend vẫn đang khởi động. Chờ ~30 giây rồi tải lại trang.

Lỗi: Real-time không đồng bộ
Cách xử lý: Đảm bảo cổng 3001 không bị chặn. Kiểm tra:
             docker compose ps
             docker compose logs websocket

================================================================================
  KẾT THÚC FILE HƯỚNG DẪN
================================================================================
