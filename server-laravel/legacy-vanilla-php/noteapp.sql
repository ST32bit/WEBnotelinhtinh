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
  password          VARCHAR(255)  NOT NULL,
  avatar            TEXT          DEFAULT NULL,
  bio               VARCHAR(255)  DEFAULT '',
  accent_color      VARCHAR(100)  DEFAULT 'from-indigo-500 to-violet-600',
  is_active         TINYINT(1)    NOT NULL DEFAULT 0,
  activation_token  VARCHAR(255)  DEFAULT NULL,
  activation_expiry DATETIME      DEFAULT NULL,
  reset_token       VARCHAR(255)  DEFAULT NULL,
  reset_expiry      DATETIME      DEFAULT NULL,
  preferences       JSON          DEFAULT NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. BẢNG USER_SESSIONS
-- ============================================
CREATE TABLE user_sessions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  TEXT         DEFAULT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. BẢNG LABELS
-- ============================================
CREATE TABLE labels (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  DEFAULT '#6366f1',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_label_per_user (user_id, name)
);

-- ============================================
-- 4. BẢNG NOTES
-- ============================================
CREATE TABLE notes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  content       LONGTEXT      DEFAULT NULL,
  is_pinned     TINYINT(1)    NOT NULL DEFAULT 0,
  note_password VARCHAR(255)  DEFAULT NULL,
  visibility    ENUM('private','link','public') DEFAULT 'private',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notes (user_id),
  FULLTEXT INDEX ft_notes_search (title, content)
);

-- ============================================
-- 5. BẢNG NOTE_LABELS (pivot)
-- ============================================
CREATE TABLE note_labels (
  note_id    INT NOT NULL,
  label_id   INT NOT NULL,
  PRIMARY KEY (note_id, label_id),
  FOREIGN KEY (note_id)  REFERENCES notes(id)  ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- ============================================
-- 6. BẢNG NOTE_ATTACHMENTS
-- ============================================
CREATE TABLE note_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  note_id     INT           NOT NULL,
  file_name   VARCHAR(255)  NOT NULL,
  file_path   VARCHAR(500)  NOT NULL,
  file_type   VARCHAR(100)  NOT NULL,
  file_size   INT           NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- ============================================
-- 7. BẢNG SHARED_NOTES
-- ============================================
CREATE TABLE shared_notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  note_id     INT          NOT NULL,
  owner_id    INT          NOT NULL,
  shared_with INT          NOT NULL,
  role        ENUM('viewer','editor') NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_share (note_id, shared_with),
  FOREIGN KEY (note_id)     REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- DỮ LIỆU MẪU
-- ============================================
INSERT INTO users (email, username, display_name, password, is_active) VALUES
('demo@noteapp.com', 'demo_user', 'Demo User', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

INSERT INTO labels (user_id, name, color) VALUES
(1, 'Học tập', '#6366f1'),
(1, 'Công việc', '#10b981'),
(1, 'Cá nhân', '#f59e0b');

INSERT INTO notes (user_id, title, content, is_pinned) VALUES
(1, 'Note đầu tiên', '<p>Đây là nội dung note mẫu.</p>', 0),
(1, 'Note quan trọng', '<p>Nội dung quan trọng cần ghim.</p>', 1);
