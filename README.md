# NoteApp — Final Project 503073

> Ứng dụng ghi chú dành cho sinh viên, xây dựng bằng **React + Vite** (Frontend) và **PHP thuần** (Backend).

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [28 Tiêu chí](#-28-tiêu-chí)

---

## ✨ Tính năng

### Account Management
- ✅ Đăng ký (email + username + displayName + password x2)
- ✅ Kích hoạt tài khoản qua email
- ✅ Đăng nhập / Đăng xuất (JWT)
- ✅ Reset mật khẩu qua email
- ✅ Xem / Chỉnh sửa profile + avatar
- ✅ Đổi mật khẩu
- ✅ Tùy chọn (dark/light theme)

### Note Management
- ✅ List view / Grid view
- ✅ Thêm / Sửa / Xóa note (title + content)
- ✅ Tìm kiếm debounced real-time
- ✅ Lọc theo label
- ✅ Sắp xếp (modified, created, pinned)
- ✅ Ghim / Bỏ ghim
- ✅ Khóa note bằng mật khẩu
- ✅ Label CRUD (tạo / sửa / xóa)
- ✅ Đính kèm ảnh (upload thật)
- ✅ Real-time polling
- ✅ Dark / Light theme
- ✅ Responsive Mobile + Tablet

### Advanced
- ✅ Chia sẻ note (email + role viewer/editor)
- ✅ Real-time collaboration (polling)
- ✅ PWA Offline (Service Worker)

---

## 🛠 Công nghệ

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 3 |
| Backend | PHP thuần (PDO MySQL) |
| Database | MySQL / MariaDB (utf8mb4) |
| Auth | JWT tự viết (HMAC-SHA256) |
| Password | bcrypt (PASSWORD_BCRYPT) |
| PWA | manifest.json + Service Worker |

---

## 📁 Cấu trúc dự án

```
WEBnotelinhtinh/
├── index.html              # Entry point + PWA meta
├── vite.config.js
├── package.json
├── tailwind.config.js
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx             # Routes
│   ├── api.js              # Centralized API client
│   ├── index.css
│   ├── components/
│   │   └── LabelManager.jsx
│   └── pages/
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── ForgotPassword.jsx
│       ├── ResetPassword.jsx
│       ├── Home.jsx        # Main app (notes, calendar, etc.)
│       └── User.jsx        # Profile management
├── server/
│   ├── noteapp.sql         # Database schema + sample data
│   ├── .htaccess
│   ├── config/
│   │   ├── db.php          # PDO connection
│   │   └── cors.php        # CORS headers
│   ├── helpers/
│   │   └── jwt.php         # JWT encode/decode
│   ├── middleware/
│   │   └── auth.php        # JWT authentication
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.php
│   │   │   ├── login.php
│   │   │   ├── logout.php
│   │   │   ├── activate.php
│   │   │   ├── change_password.php
│   │   │   ├── forgot_password.php
│   │   │   └── reset_password.php
│   │   ├── users/
│   │   │   ├── me.php
│   │   │   └── preferences.php
│   │   ├── notes/
│   │   │   ├── index.php
│   │   │   ├── pin.php
│   │   │   ├── lock.php
│   │   │   ├── attachments.php
│   │   │   ├── share.php
│   │   │   └── poll.php
│   │   └── labels/
│   │       └── index.php
│   └── uploads/            # Uploaded files
└── analysis_28_criteria.md # Criteria analysis
```

---

## 🚀 Cài đặt

### 1. Database
```bash
# Import SQL vào MySQL/MariaDB
mysql -u root -p < server/noteapp.sql
```

### 2. Backend (PHP)
```bash
# Copy thư mục server/ vào htdocs của XAMPP
# Đổi tên thành noteapp-server
cp -r server/ C:/xampp/htdocs/noteapp-server/

# Kiểm tra config/db.php cho đúng credentials
# Bật Apache trong XAMPP
```

### 3. Frontend (React)
```bash
npm install
npm run dev
# Mở http://localhost:5173
```

### 4. Tài khoản demo
```
Email: demo@noteapp.com
Password: password
```

---

## 📊 28 Tiêu chí

| # | Tiêu chí | File chính |
|---|---|---|
| 1 | Đăng ký | register.php, Register.jsx |
| 2 | Kích hoạt email | register.php, activate.php |
| 3 | Đăng nhập/xuất | login.php, logout.php, Login.jsx |
| 4 | Reset mật khẩu | forgot_password.php, reset_password.php |
| 5 | Xem profile | me.php (GET), User.jsx |
| 6 | Sửa profile | me.php (PUT), User.jsx |
| 7 | Đổi mật khẩu | change_password.php, User.jsx |
| 8 | User preferences | preferences.php, Home.jsx |
| 9 | List view | Home.jsx (viewMode=list) |
| 10 | Grid view | Home.jsx (viewMode=grid) |
| 11 | Thêm note | notes/index.php (POST) |
| 12 | Sửa note | notes/index.php (PUT) |
| 13 | Xóa note | notes/index.php (DELETE) |
| 14 | Search debounced | notes/index.php (?q=) |
| 15 | Filter label | notes/index.php (?label_id=) |
| 16 | Sort | notes/index.php (?sort=) |
| 17 | Pin/Unpin | pin.php |
| 18 | Lock/Unlock | lock.php |
| 19 | Label CRUD | labels/index.php, LabelManager.jsx |
| 20 | Attach images | attachments.php |
| 21 | Real-time | poll.php |
| 22 | Dark/Light | tailwind darkMode, Home.jsx |
| 23 | Responsive Mobile | TailwindCSS responsive |
| 24 | Responsive Tablet | TailwindCSS responsive |
| 25 | Share note | share.php, ShareModal |
| 26 | Real-time collab | poll.php (polling) |
| 27 | PWA Offline | manifest.json, sw.js |
| 28 | Deploy | docker-compose / hosting |
| G1 | Source code | Structured project |
| G2 | SQL file | noteapp.sql |
| G3 | README | README.md |
| G4 | Video demo | demo.mp4 (tự quay) |

---

## 📝 License

Final Project — Môn 503073. Chỉ dùng cho mục đích học tập.
