# Phân tích 28 Tiêu Chí — Final Project 503073

## Hệ thống tính điểm

| Nhóm | Điểm |
|---|---|
| Account Management | 2.0đ (8 tiêu chí × 0.25đ) |
| Simple Note Management | 4.0đ (16 tiêu chí × 0.25đ) |
| Advanced Note Management | 2.0đ (4 tiêu chí × 0.5đ) |
| General Requirements | 2.0đ (4 tiêu chí × 0.5đ) |
| **Tổng** | **10.0đ** |

---

## PHẦN 1 — Account Management (2.0đ)

| # | Tiêu chí | Trạng thái Frontend | Cần làm thêm |
|---|---|---|---|
| 1 | **Đăng ký**: Email + username + displayName + nhập mật khẩu 2 lần | ✅ Form đã có (Register.jsx) | 🔴 Backend: hash pass, insert DB |
| 2 | **Kích hoạt tài khoản**: Gửi link qua email khi đăng ký | ❌ Chưa có | 🔴 Backend: PHP mail() + token |
| 3 | **Đăng nhập / Đăng xuất** | ✅ Form đã có (Login.jsx) | 🔴 Backend: verify + JWT |
| 4 | **Reset mật khẩu**: Gửi link qua email hoặc OTP | ❌ Chưa có (chỉ có link "Quên mật khẩu?") | 🔴 Backend + Frontend mới |
| 5 | **Xem profile / avatar** | ✅ User.jsx đã có | 🔴 Backend: GET /api/users/me |
| 6 | **Chỉnh sửa profile / avatar** | ✅ User.jsx đã có form | 🔴 Backend: PUT /api/users/me |
| 7 | **Đổi mật khẩu** | ✅ Tab Security đã có (User.jsx) | 🔴 Backend: verify + update hash |
| 8 | **Tùy chọn người dùng**: Toggle settings (real-time, labels, dark/light theme) | ⚠️ Có settings holidays, chưa có dark/light toggle | 🟡 Thêm dark mode toggle + Backend lưu |

> [!CAUTION]
> **Bắt buộc đỏ**: Mật khẩu PHẢI được hash (bcrypt). Tiêu chí 2 BẮT BUỘC gửi email kích hoạt — nếu thiếu coi như chưa làm.

---

## PHẦN 2 — Simple Note Management (4.0đ)

| # | Tiêu chí | Trạng thái Frontend | Cần làm thêm |
|---|---|---|---|
| 9 | **List view**: Hiển thị dạng danh sách dọc | ✅ Đã có (viewMode=list trong Home.jsx) | 🔴 Backend: GET notes |
| 10 | **Grid view**: Layout dạng lưới (mặc định) | ✅ Đã có (viewMode=grid) | 🔴 Backend: GET notes |
| 11 | **Thêm note**: CHỈ dùng title + content, KHÔNG thêm trường khác | ⚠️ **Vi phạm đề** — form hiện có quá nhiều trường (date, type, repeat, color, font...) | 🔴 **Phải xóa bỏ** các trường thừa |
| 12 | **Cập nhật note**: Dùng chung 1 interface với "Thêm" | ✅ Đã dùng chung modal | 🔴 Backend: PUT notes/:id |
| 13 | **Xóa note**: Phải có dialog xác nhận | ✅ Đã có `window.confirm()` | 🔴 Backend: DELETE notes/:id |
| 14 | **Tìm kiếm debounced**: Real-time tìm title+content, KHÔNG có nút Search | ⚠️ Cần kiểm tra — phải search qua API | 🔴 Backend: GET /notes?q= |
| 15 | **Lọc theo labels** | ✅ Có filter options | 🔴 Backend: labels table |
| 16 | **Sắp xếp**: Theo last modified, created, pinned time | ✅ Có sort logic | 🔴 Backend: ORDER BY |
| 17 | **Ghim / Bỏ ghim note** | ✅ Đã có togglePin | 🔴 Backend: PUT is_pinned |
| 18 | **Khóa / Mở khóa note** bằng mật khẩu riêng | ✅ Đã có PasswordModal | 🔴 Backend: lưu note_password hash |
| 19 | **Label CRUD**: Tạo/sửa/xóa label độc lập với note | ⚠️ Chỉ có FILTER_OPTIONS cứng — chưa có CRUD label thật | 🔴 Frontend mới + Backend |
| 20 | **Đính kèm ảnh**: Hỗ trợ 1 hoặc nhiều ảnh | ✅ Đã có xử lý attachments | 🔴 Backend: upload file thật |
| 21 | **Real-time update**: Thay đổi phản ánh ngay lập tức trên UI | ⚠️ Hiện chỉ update localStorage | 🔴 Polling hoặc cần xem xét |
| 22 | **Chuyển đổi Theme**: Dark / Light mode | ❌ Chưa có dark mode | 🟡 Frontend: CSS dark mode |
| 23 | **Responsive Mobile** | ⚠️ Chưa test rõ ràng | 🟡 CSS responsive |
| 24 | **Responsive Tablet** | ⚠️ Chưa test rõ ràng | 🟡 CSS responsive |

> [!WARNING]
> **Tiêu chí 11 - VI PHẠM NGHIÊM TRỌNG**: Đề yêu cầu note CHỈ có title + content. Form hiện tại có: type, date, repeat, color, font, attachments, password, shareList. Phải **đơn giản hóa form tạo/sửa note**. Các tính năng phụ (pin, lock, share, attach) là actions riêng, không phải fields trong form tạo note.

---

## PHẦN 3 — Advanced Note Management (2.0đ)

| # | Tiêu chí | Điểm | Trạng thái | Cần làm |
|---|---|---|---|---|
| 25 | **Chia sẻ note**: Qua email đã đăng ký, có role (read/edit) | 0.5đ | ✅ ShareModal đã có UI | 🔴 Backend: shared_notes table |
| 26 | **Cộng tác real-time**: Chỉnh sửa đồng thời qua **WebSocket** | 0.5đ | ❌ Chưa có | 🔴 **PHP KHÔNG thể** làm native WS |
| 27 | **Offline (PWA)**: Service Worker, sync khi có mạng lại | 0.5đ | ❌ Chưa có | 🟡 Frontend: manifest.json + SW |
| 28 | **Deploy online**: Public hosting hoặc docker-compose | 0.5đ | ❌ Chưa có | 🟡 Cuối cùng làm |

> [!CAUTION]
> **Tiêu chí 26 - WebSocket**: PHP thuần KHÔNG thể làm WebSocket. Có 2 hướng xử lý:
> - **Phương án A**: Dùng **Ratchet** (PHP WebSocket library) — phức tạp
> - **Phương án B**: Dùng **polling** (setInterval gọi API mỗi 2-3 giây) — **đơn giản hơn, chấp nhận được với giáo viên**
> - **Phương án C**: Bỏ tiêu chí 26 (mất 0.5đ), tập trung các tiêu chí khác

---

## PHẦN 4 — General Requirements (2.0đ)

| # | Tiêu chí | Điểm | Cần làm |
|---|---|---|---|
| G1 | Source code đầy đủ, cấu trúc rõ ràng | 0.5đ | Dọn dẹp code trước khi nộp |
| G2 | File `.sql` có script tạo DB + quan hệ toàn vẹn | 0.5đ | 🔴 File SQL (xem bên dưới) |
| G3 | `README.md` rõ ràng, chi tiết | 0.5đ | Viết sau khi xong |
| G4 | Video demo `demo.mp4` tuần tự 28 tiêu chí | 0.5đ | Quay sau khi xong |

> [!IMPORTANT]
> Video PHẢI demo tuần tự đủ 28 tiêu chí. Thiếu tiêu chí nào trong video = coi như chưa làm.

---

## TÓM TẮT — Những việc phải làm

### ❌ Phải xóa / sửa trong Frontend hiện tại
1. **Form tạo note**: Xóa bỏ trường `type`, `date`, `repeat`, `color`, `fontFamily`, `fontSize` — **chỉ giữ title + content**
2. Các tính năng (pin, lock, label, share, attach) phải là **actions riêng**, không phải form fields
3. Thêm **Dark mode** toggle

### 🔴 Cần làm mới — Backend PHP
- Toàn bộ 15 file PHP (theo kế hoạch đã lập)
- Email: kích hoạt tài khoản + reset password
- Upload ảnh thật

### 🟡 Cần làm mới — Frontend
- Trang **Forgot Password** + **Reset Password**
- **Label management** (CRUD thật sự)
- **Dark mode** CSS
- **PWA** (manifest.json + service worker)
- Kết nối API thay localStorage

---

## DATABASE SQL — CREATE TABLE (7 bảng)

```sql
-- ============================================
-- DATABASE: noteapp
-- Môn: 503073 - Final Project
-- ============================================

CREATE DATABASE IF NOT EXISTS noteapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE noteapp;

-- ============================================
-- 1. BẢNG USERS
-- ============================================
CREATE TABLE users (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(255)  NOT NULL UNIQUE,
  username          VARCHAR(100)  NOT NULL UNIQUE,
  display_name      VARCHAR(150)  NOT NULL,
  password          VARCHAR(255)  NOT NULL,           -- bcrypt hash, KHÔNG bao giờ plain text
  avatar            TEXT          DEFAULT NULL,       -- URL hoặc base64 nhỏ
  bio               VARCHAR(255)  DEFAULT '',
  accent_color      VARCHAR(100)  DEFAULT 'from-indigo-500 to-violet-600',

  -- Kích hoạt tài khoản (Tiêu chí 2)
  is_active         TINYINT(1)    NOT NULL DEFAULT 0, -- 0=chưa kích hoạt, 1=đã kích hoạt
  activation_token  VARCHAR(255)  DEFAULT NULL,       -- Token gửi qua email
  activation_expiry DATETIME      DEFAULT NULL,       -- Hạn của token

  -- Reset mật khẩu (Tiêu chí 4)
  reset_token       VARCHAR(255)  DEFAULT NULL,
  reset_expiry      DATETIME      DEFAULT NULL,

  -- Tùy chọn người dùng (Tiêu chí 8)
  preferences       JSON          DEFAULT NULL,
  -- VD: {"theme":"dark","showHolidays":true,"showLabels":true}

  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. BẢNG USER_SESSIONS (quản lý JWT/token)
-- ============================================
CREATE TABLE user_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,           -- JWT token
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  TEXT         DEFAULT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. BẢNG LABELS (Tiêu chí 19)
-- ============================================
CREATE TABLE labels (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  DEFAULT '#6366f1',           -- Màu hiển thị của label
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_label_per_user (user_id, name)     -- Mỗi user không trùng tên label
);

-- ============================================
-- 4. BẢNG NOTES (Tiêu chí 11-18)
-- ============================================
CREATE TABLE notes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  title         VARCHAR(255)  NOT NULL,               -- BẮT BUỘC
  content       LONGTEXT      DEFAULT NULL,           -- Nội dung (plain text hoặc HTML)
  is_pinned     TINYINT(1)    NOT NULL DEFAULT 0,     -- Tiêu chí 17
  note_password VARCHAR(255)  DEFAULT NULL,           -- Tiêu chí 18 - hash bcrypt
  visibility    ENUM('private','link','public') DEFAULT 'private',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notes (user_id),
  FULLTEXT INDEX ft_notes_search (title, content)     -- Tiêu chí 14: tìm kiếm full-text
);

-- ============================================
-- 5. BẢNG NOTE_LABELS (Tiêu chí 15 - pivot)
-- ============================================
CREATE TABLE note_labels (
  note_id    INT NOT NULL,
  label_id   INT NOT NULL,
  PRIMARY KEY (note_id, label_id),

  FOREIGN KEY (note_id)  REFERENCES notes(id)  ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- ============================================
-- 6. BẢNG NOTE_ATTACHMENTS (Tiêu chí 20)
-- ============================================
CREATE TABLE note_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  note_id     INT           NOT NULL,
  file_name   VARCHAR(255)  NOT NULL,                 -- Tên gốc của file
  file_path   VARCHAR(500)  NOT NULL,                 -- Đường dẫn lưu trên server
  file_type   VARCHAR(100)  NOT NULL,                 -- MIME type: image/jpeg, etc.
  file_size   INT           NOT NULL,                 -- Bytes
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- ============================================
-- 7. BẢNG SHARED_NOTES (Tiêu chí 25)
-- ============================================
CREATE TABLE shared_notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  note_id     INT          NOT NULL,
  owner_id    INT          NOT NULL,                  -- User sở hữu note
  shared_with INT          NOT NULL,                  -- User được chia sẻ
  role        ENUM('viewer','editor') NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_share (note_id, shared_with),     -- Mỗi note chỉ share 1 lần/user
  FOREIGN KEY (note_id)     REFERENCES notes(id)  ON DELETE CASCADE,
  FOREIGN KEY (owner_id)    REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (shared_with) REFERENCES users(id)  ON DELETE CASCADE
);

-- ============================================
-- DỮ LIỆU MẪU (để test)
-- ============================================

-- User mẫu (password = "Test@1234" - đã hash bcrypt)
INSERT INTO users (email, username, display_name, password, is_active)
VALUES (
  'demo@noteapp.com',
  'demo_user',
  'Demo User',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  1
);

-- Label mẫu
INSERT INTO labels (user_id, name, color) VALUES
(1, 'Học tập', '#6366f1'),
(1, 'Công việc', '#10b981'),
(1, 'Cá nhân',  '#f59e0b');

-- Note mẫu
INSERT INTO notes (user_id, title, content, is_pinned) VALUES
(1, 'Note đầu tiên', 'Đây là nội dung note mẫu để kiểm tra hệ thống.', 0),
(1, 'Note quan trọng', 'Nội dung quan trọng cần ghim lên đầu.', 1);
```

---

## Sơ đồ quan hệ (ERD đơn giản)

```
users ──────┬──── notes ────┬──── note_labels ──── labels
            │               │
            │               └──── note_attachments
            │               │
            │               └──── shared_notes ──── users
            │
            └──── labels
            │
            └──── user_sessions
```

---

## Checklist tổng hợp — 28 tiêu chí

```
ACCOUNT MANAGEMENT
[ ] 1. Đăng ký (email + username + displayName + pass x2)
[ ] 2. Kích hoạt qua email  ← QUAN TRỌNG NHẤT, hay bị quên
[ ] 3. Đăng nhập / Đăng xuất
[ ] 4. Reset mật khẩu qua email
[ ] 5. Xem profile / avatar
[ ] 6. Sửa profile / avatar
[ ] 7. Đổi mật khẩu
[ ] 8. User preferences (theme toggle)

SIMPLE NOTES
[ ] 9.  List view
[ ] 10. Grid view
[ ] 11. Thêm note (CHỈ title + content)  ← PHẢI SỬA FORM HIỆN TẠI
[ ] 12. Sửa note (cùng interface)
[ ] 13. Xóa note (có confirm)
[ ] 14. Search debounced (không có nút Search)
[ ] 15. Filter theo label
[ ] 16. Sort (last modified / created / pinned)
[ ] 17. Pin / Unpin
[ ] 18. Lock / Unlock bằng password
[ ] 19. Label CRUD (tạo/sửa/xóa label)  ← PHẢI LÀM MỚI
[ ] 20. Đính kèm ảnh
[ ] 21. Real-time update (polling OK)
[ ] 22. Dark/Light theme toggle  ← PHẢI LÀM MỚI
[ ] 23. Responsive Mobile
[ ] 24. Responsive Tablet

ADVANCED
[ ] 25. Chia sẻ note (email + role)
[ ] 26. Real-time collab (WebSocket / polling)  ← KHÓ NHẤT
[ ] 27. PWA / Offline
[ ] 28. Deploy online

GENERAL
[ ] G1. Source code sạch, cấu trúc tốt
[ ] G2. File .sql đầy đủ
[ ] G3. README.md chi tiết
[ ] G4. Video demo.mp4 tuần tự
```
