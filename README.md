# 📝 NoteApp — Dự án cuối kỳ 503073

Ứng dụng ghi chú hiện đại, xây dựng bằng **React 19 + Laravel 11**, triển khai qua **Docker Compose**.

---

## ✨ Tính năng nổi bật

- 🔐 Đăng ký, kích hoạt qua email, đăng nhập/xuất, reset mật khẩu
- 📝 Tạo / Sửa / Xóa ghi chú với tự động lưu (debounce 600ms)
- 🔍 Tìm kiếm toàn văn bản theo thời gian thực (debounce 300ms)
- 🏷️ Quản lý nhãn (CRUD) và lọc ghi chú theo nhãn
- 📌 Ghim ghi chú lên đầu
- 🔒 Khóa ghi chú bằng mật khẩu riêng (bcrypt)
- 📎 Đính kèm ảnh (upload lên server)
- 🔗 Chia sẻ ghi chú theo email với phân quyền Xem / Sửa
- ⚡ Cộng tác thời gian thực qua **WebSocket (Socket.IO)**
- 📧 Gửi email thật (kích hoạt, reset, thông báo chia sẻ)
- 🌙 Dark / Light mode
- 📱 Responsive (Mobile + Tablet)
- 📦 PWA — cài được như app, xem offline

---

## 🛠 Công nghệ

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 3 |
| Backend | Laravel 11 (PHP 8.2), Sanctum |
| Database | MySQL 8.0 |
| Real-time | Socket.IO (Node.js) |
| Email | PHPMailer (Gmail SMTP) |
| Triển khai | Docker Compose (4 containers) |

---

## 🚀 Chạy với Docker Compose

### Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài và đang chạy
- Các cổng **5173, 8000, 3001, 3306, 8080** chưa bị dùng

### Các bước

```bash
# 1. Clone repo hoặc giải nén file ZIP
cd www/

# 2. Khởi động toàn bộ hệ thống (lần đầu ~60 giây)
docker compose up -d --build

# 3. Chạy migration database (chỉ cần lần đầu)
docker exec www-backend-1 php artisan migrate --force

# 4. Mở trình duyệt
# http://localhost:5173
```

### Địa chỉ truy cập

| Dịch vụ | URL |
|---|---|
| 🌐 Ứng dụng chính | http://localhost:5173 |
| ⚙️ API Backend | http://localhost:8000/api |
| 🗄️ phpMyAdmin | http://localhost:8080 (root/root) |

### Lệnh hữu ích

```bash
docker compose down          # Dừng tất cả
docker compose logs -f       # Xem logs
docker compose ps            # Kiểm tra trạng thái
```

---

## 🔑 Tài khoản demo

Tài khoản sau đã có sẵn ghi chú, nhãn và dữ liệu mẫu:

| Email | Mật khẩu |
|---|---|
| `demo@noteapp.com` | `password` |

Để tự đăng ký tài khoản mới: truy cập `/register`, điền thông tin và kích hoạt qua email.

---

## 📁 Cấu trúc dự án

```
www/
├── docker-compose.yml          # Khởi chạy toàn hệ thống
├── readme.txt                  # Hướng dẫn nộp bài (tiếng Việt)
├── frontend-react/             # React + Vite
│   ├── src/pages/
│   │   ├── Home.jsx            # App chính (ghi chú, chia sẻ, lịch)
│   │   ├── User.jsx            # Hồ sơ & đổi mật khẩu
│   │   ├── Login.jsx / Register.jsx
│   │   ├── ForgotPassword.jsx / ResetPassword.jsx
│   │   └── ...
│   └── public/
│       ├── manifest.json       # PWA
│       └── sw.js               # Service Worker (offline)
├── server-laravel/             # Laravel 11 API
│   ├── app/Http/Controllers/
│   │   ├── AuthController.php
│   │   ├── NoteController.php
│   │   ├── NoteShareController.php
│   │   ├── LabelController.php
│   │   └── UserController.php
│   └── routes/api.php          # 30+ API endpoints
└── websocket-server/           # Socket.IO real-time
    └── server.js
```

---

## ✅ 28 Tiêu chí đánh giá

### Quản lý tài khoản
| # | Tiêu chí | File chính |
|---|---|---|
| 1 | Đăng ký (email + username + tên + mật khẩu ×2) | `Register.jsx`, `AuthController` |
| 2 | Kích hoạt tài khoản qua email | `AuthController::activate()` |
| 3 | Đăng nhập / Đăng xuất (Sanctum token) | `Login.jsx`, `AuthController::login()` |
| 4 | Reset mật khẩu qua email | `ForgotPassword.jsx`, `AuthController::forgotPassword()` |
| 5 | Xem hồ sơ & avatar | `User.jsx`, `UserController::show()` |
| 6 | Chỉnh sửa hồ sơ & avatar | `User.jsx`, `UserController::update()` |
| 7 | Đổi mật khẩu (yêu cầu mật khẩu cũ) | `User.jsx`, `AuthController::changePassword()` |
| 8 | Tùy chọn người dùng (theme, font, màu) | `Home.jsx`, `UserController::updatePreferences()` |

### Quản lý ghi chú cơ bản
| # | Tiêu chí | File chính |
|---|---|---|
| 9 | Hiển thị dạng List View | `Home.jsx` (viewMode=list) |
| 10 | Hiển thị dạng Grid View | `Home.jsx` (viewMode=grid) |
| 11 | Tạo ghi chú (title + content) | `NoteController::store()` |
| 12 | Cập nhật ghi chú | `NoteController::update()` |
| 13 | Xóa ghi chú (có xác nhận) | `NoteController::destroy()` |
| 14 | Tự động lưu debounced 600ms | `triggerAutoSave()` trong `Home.jsx` |
| 15 | Đính kèm ảnh (upload server) | `NoteAttachmentController` |
| 16 | Ghim ghi chú | `NoteController::togglePin()` |
| 17 | Tìm kiếm debounced 300ms | `NoteController::index()?q=` |
| 18 | Quản lý nhãn CRUD | `LabelController`, `handleSaveGlobalLabels()` |
| 19 | Gắn nhãn vào ghi chú | `NoteController::update()` + `label_ids` |
| 20 | Lọc ghi chú theo nhãn | `NoteController::index()?label_id=` |
| 21 | Bật/Tắt mật khẩu ghi chú | `NoteController::lock()` |
| 22 | Đổi mật khẩu ghi chú | `NoteController::lock()` |

### Tính năng nâng cao
| # | Tiêu chí | File chính |
|---|---|---|
| 23 | Chia sẻ & nhận ghi chú (email + thông báo) | `NoteShareController`, `ShareModal` |
| 24 | Cộng tác real-time (WebSocket) | `websocket-server/server.js`, `Home.jsx` |
| 25 | UI/UX (animation, dark mode, toast) | `Home.jsx`, `index.css` |
| 26 | Responsive (mobile + tablet) | TailwindCSS breakpoints |
| 27 | PWA Offline (Service Worker) | `public/sw.js`, `public/manifest.json` |
| 28 | Triển khai Docker Compose | `docker-compose.yml` |

---

## 🔒 Bảo mật (Better Approach)

- Mật khẩu tài khoản hash **bcrypt** — không bao giờ lưu plain text
- Mật khẩu ghi chú hash **bcrypt** riêng biệt
- Đổi mật khẩu ghi chú: nhập **mật khẩu cũ + mới ×2**
- Gỡ mật khẩu ghi chú: bắt buộc **xác nhận mật khẩu hiện tại**
- Ghi chú đang khóa **không thể chia sẻ** cho đến khi mở khóa
- Chia sẻ ghi chú: **validate email** người nhận tồn tại trước khi lưu
- Gửi **email thông báo** cho người nhận khi có ghi chú được chia sẻ

---

## 📝 Ghi chú

Môn học 503073 — Chỉ dùng cho mục đích học tập.
