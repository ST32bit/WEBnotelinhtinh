<?php
// api/notes/index.php — CRUD Notes (Tiêu chí 9-14, 16)
// GET    → List notes (+ search q=, sort, filter label_id)
// POST   → Create note (CHỈ title + content — Tiêu chí 11)
// PUT    → Update note (Tiêu chí 12)
// DELETE → Delete note (Tiêu chí 13)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: List notes (Tiêu chí 9, 10, 14, 15, 16) ──
if ($method === 'GET') {
    $search  = trim($_GET['q'] ?? '');
    $sort    = $_GET['sort'] ?? 'updated_at';       // Tiêu chí 16
    $order   = strtoupper($_GET['order'] ?? 'DESC');
    $labelId = intval($_GET['label_id'] ?? 0);       // Tiêu chí 15
    $page    = max(1, intval($_GET['page'] ?? 1));
    $limit   = min(100, max(1, intval($_GET['limit'] ?? 50)));
    $offset  = ($page - 1) * $limit;

    // Whitelist sort columns (Tiêu chí 16: last modified, created, pinned time)
    $allowedSorts = ['updated_at', 'created_at', 'is_pinned', 'title'];
    if (!in_array($sort, $allowedSorts)) $sort = 'updated_at';
    if (!in_array($order, ['ASC', 'DESC'])) $order = 'DESC';

    $where  = ['(n.user_id = ? OR sn.shared_with = ?)'];
    $params = [$userId, $userId];

    // Tiêu chí 14: Tìm kiếm debounced full-text
    if ($search) {
        $where[]  = '(n.title LIKE ? OR n.content LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    // Tiêu chí 15: Lọc theo label
    $joinLabel = '';
    if ($labelId > 0) {
        $joinLabel = 'INNER JOIN note_labels nl ON nl.note_id = n.id AND nl.label_id = ?';
        array_unshift($params, $labelId); // prepend
    }

    $whereClause = implode(' AND ', $where);

    // Count total
    $countSql = "SELECT COUNT(DISTINCT n.id) as total FROM notes n LEFT JOIN shared_notes sn ON n.id = sn.note_id $joinLabel WHERE $whereClause";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    // Fetch notes — Tiêu chí 16: sort order, pinned always on top
    $sql = "SELECT DISTINCT n.* FROM notes n LEFT JOIN shared_notes sn ON n.id = sn.note_id $joinLabel
            WHERE $whereClause
            ORDER BY n.is_pinned DESC, n.$sort $order
            LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notes = $stmt->fetchAll();

    // Attach labels + attachments for each note
    foreach ($notes as &$note) {
        $note['attachments'] = $note['attachments'] ? json_decode($note['attachments'], true) : [];
        $note['labels']      = $note['labels'] ? json_decode($note['labels'], true) : [];
        $note['fontFamily']  = $note['font_family'];
        $note['fontSize']    = $note['font_size'];
        $note['isPinned']    = $note['is_pinned'] == 1;
        $note['pinnedAt']    = $note['pinned_at'];
        $note['password']    = $note['note_password'];
        
        // Shared with (Tiêu chí 25)
        $shStmt = $pdo->prepare('
            SELECT sn.id, sn.role, u.email, u.display_name
            FROM shared_notes sn
            INNER JOIN users u ON u.id = sn.shared_with
            WHERE sn.note_id = ? AND sn.owner_id = ?
        ');
        $shStmt->execute([$note['id'], $userId]);
        $note['shareList'] = $shStmt->fetchAll();
    }

    echo json_encode([
        'success' => true,
        'notes'   => $notes,
        'total'   => (int)$total,
        'page'    => $page,
        'limit'   => $limit,
    ]);
    exit;
}

// ── POST: Create note (Tiêu chí 11) ──
if ($method === 'POST') {
    $input   = json_decode(file_get_contents('php://input'), true);
    $title   = trim($input['title'] ?? '');
    $content = $input['content'] ?? '';

    if (!$title) {
        http_response_code(400);
        echo json_encode(['error' => 'Tiêu đề là bắt buộc']);
        exit;
    }

    $color       = $input['color'] ?? '#fef08a';
    $fontFamily  = $input['fontFamily'] ?? 'Nunito';
    $fontSize    = isset($input['fontSize']) ? (int)$input['fontSize'] : 14;
    $isPinned    = !empty($input['isPinned']) ? 1 : 0;
    $pinnedAt    = $isPinned ? date('Y-m-d H:i:s') : null;
    
    $attachments = isset($input['attachments']) ? json_encode($input['attachments']) : null;
    $labels      = isset($input['labels']) ? json_encode($input['labels']) : null;
    $password    = $input['password'] ?? null;
    $visibility  = $input['visibility'] ?? 'private';

    $stmt = $pdo->prepare('INSERT INTO notes (user_id, title, content, color, font_family, font_size, is_pinned, pinned_at, attachments, labels, note_password, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $title, $content, $color, $fontFamily, $fontSize, $isPinned, $pinnedAt, $attachments, $labels, $password, $visibility]);
    $noteId = $pdo->lastInsertId();

    // Fetch note vừa tạo
    $stmt = $pdo->prepare('SELECT * FROM notes WHERE id = ?');
    $stmt->execute([$noteId]);
    $note = $stmt->fetch();
    
    // Parse JSON for frontend
    $note['attachments'] = $note['attachments'] ? json_decode($note['attachments'], true) : [];
    $note['labels']      = $note['labels'] ? json_decode($note['labels'], true) : [];
    $note['shareList']   = [];
    $note['fontFamily']  = $note['font_family'];
    $note['fontSize']    = $note['font_size'];
    $note['isPinned']    = $note['is_pinned'] == 1;
    $note['pinnedAt']    = $note['pinned_at'];
    $note['password']    = $note['note_password'];

    if (isset($input['shareList']) && is_array($input['shareList'])) {
        foreach ($input['shareList'] as $share) {
            $sEmail = $share['email'] ?? '';
            $sRole  = $share['role'] ?? 'viewer';
            if ($sEmail) {
                $uStmt = $pdo->prepare('SELECT id, display_name FROM users WHERE email = ?');
                $uStmt->execute([$sEmail]);
                if ($sUser = $uStmt->fetch()) {
                    $snStmt = $pdo->prepare('INSERT INTO shared_notes (note_id, owner_id, shared_with, role) VALUES (?, ?, ?, ?)');
                    $snStmt->execute([$noteId, $userId, $sUser['id'], $sRole]);
                    $note['shareList'][] = ['id' => $pdo->lastInsertId(), 'role' => $sRole, 'email' => $sEmail, 'display_name' => $sUser['display_name']];
                }
            }
        }
    }

    echo json_encode(['success' => true, 'note' => $note]);
    exit;
}

// ── PUT: Update note (Tiêu chí 12) ──
if ($method === 'PUT') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $noteId = intval($input['id'] ?? 0);
    $title  = trim($input['title'] ?? '');

    if (!$noteId || !$title) {
        http_response_code(400);
        echo json_encode(['error' => 'ID và tiêu đề là bắt buộc']);
        exit;
    }

    // Verify ownership or editor role
    $stmt = $pdo->prepare('
        SELECT n.user_id, sn.role 
        FROM notes n 
        LEFT JOIN shared_notes sn ON sn.note_id = n.id AND sn.shared_with = ?
        WHERE n.id = ? AND (n.user_id = ? OR sn.role = "editor")
    ');
    $stmt->execute([$userId, $noteId, $userId]);
    $authCheck = $stmt->fetch();
    if (!$authCheck) {
        http_response_code(403);
        echo json_encode(['error' => 'Bạn không có quyền sửa note này']);
        exit;
    }
    
    $isOwner = ($authCheck['user_id'] == $userId);

    $content     = $input['content'] ?? '';
    $color       = $input['color'] ?? '#fef08a';
    $fontFamily  = $input['fontFamily'] ?? 'Nunito';
    $fontSize    = isset($input['fontSize']) ? (int)$input['fontSize'] : 14;
    $isPinned    = !empty($input['isPinned']) ? 1 : 0;
    
    // Check old is_pinned to set pinned_at
    $stmt = $pdo->prepare('SELECT is_pinned, pinned_at FROM notes WHERE id = ?');
    $stmt->execute([$noteId]);
    $oldNote = $stmt->fetch();
    
    $pinnedAt = $oldNote['pinned_at'];
    if ($isPinned && !$oldNote['is_pinned']) {
        $pinnedAt = date('Y-m-d H:i:s');
    } elseif (!$isPinned) {
        $pinnedAt = null;
    }

    $attachments = isset($input['attachments']) ? json_encode($input['attachments']) : null;
    $labels      = isset($input['labels']) ? json_encode($input['labels']) : null;
    $password    = $input['password'] ?? null;
    $visibility  = $input['visibility'] ?? 'private';

    $stmt = $pdo->prepare('UPDATE notes SET title = ?, content = ?, color = ?, font_family = ?, font_size = ?, is_pinned = ?, pinned_at = ?, attachments = ?, labels = ?, note_password = ?, visibility = ? WHERE id = ?');
    $stmt->execute([$title, $content, $color, $fontFamily, $fontSize, $isPinned, $pinnedAt, $attachments, $labels, $password, $visibility, $noteId]);

    if ($isOwner && isset($input['shareList']) && is_array($input['shareList'])) {
        $pdo->prepare('DELETE FROM shared_notes WHERE note_id = ?')->execute([$noteId]);
        foreach ($input['shareList'] as $share) {
            $sEmail = $share['email'] ?? '';
            $sRole  = $share['role'] ?? 'viewer';
            if ($sEmail) {
                $uStmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
                $uStmt->execute([$sEmail]);
                if ($sUser = $uStmt->fetch()) {
                    $snStmt = $pdo->prepare('INSERT INTO shared_notes (note_id, owner_id, shared_with, role) VALUES (?, ?, ?, ?)');
                    $snStmt->execute([$noteId, $userId, $sUser['id'], $sRole]);
                }
            }
        }
    }

    // Fetch updated note
    $stmt = $pdo->prepare('SELECT * FROM notes WHERE id = ?');
    $stmt->execute([$noteId]);
    $note = $stmt->fetch();

    $note['attachments'] = $note['attachments'] ? json_decode($note['attachments'], true) : [];
    $note['labels']      = $note['labels'] ? json_decode($note['labels'], true) : [];
    $note['shareList']   = [];
    $note['fontFamily']  = $note['font_family'];
    $note['fontSize']    = $note['font_size'];
    $note['isPinned']    = $note['is_pinned'] == 1;
    $note['pinnedAt']    = $note['pinned_at'];
    $note['password']    = $note['note_password'];
    
    $shStmt = $pdo->prepare('
        SELECT sn.id, sn.role, u.email, u.display_name
        FROM shared_notes sn
        INNER JOIN users u ON u.id = sn.shared_with
        WHERE sn.note_id = ? AND sn.owner_id = ?
    ');
    $shStmt->execute([$note['id'], $note['user_id']]);
    $note['shareList'] = $shStmt->fetchAll();

    echo json_encode(['success' => true, 'note' => $note]);
    exit;
}

// ── DELETE: Xóa note (Tiêu chí 13) ──
if ($method === 'DELETE') {
    $noteId = intval($_GET['id'] ?? 0);

    if (!$noteId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID là bắt buộc']);
        exit;
    }

    // Verify ownership
    $stmt = $pdo->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$noteId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Bạn không có quyền xóa note này (Chỉ chủ sở hữu mới được xóa)']);
        exit;
    }

    // Xóa file đính kèm trên disk
    $attStmt = $pdo->prepare('SELECT file_path FROM note_attachments WHERE note_id = ?');
    $attStmt->execute([$noteId]);
    while ($att = $attStmt->fetch()) {
        $fullPath = __DIR__ . '/../../uploads/' . $att['file_path'];
        if (file_exists($fullPath)) unlink($fullPath);
    }

    // CASCADE sẽ xóa note_labels, note_attachments, shared_notes
    $stmt = $pdo->prepare('DELETE FROM notes WHERE id = ?');
    $stmt->execute([$noteId]);

    echo json_encode(['success' => true, 'message' => 'Đã xóa note']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
