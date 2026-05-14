<?php
// api/notes/attachments.php — Upload / Xóa ảnh đính kèm (Tiêu chí 20)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$uploadDir = __DIR__ . '/../../uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if ($method === 'POST') {
    $noteId = intval($_POST['note_id'] ?? 0);
    if (!$noteId) { http_response_code(400); echo json_encode(['error' => 'note_id bắt buộc']); exit; }

    $stmt = $pdo->prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?');
    $stmt->execute([$noteId, $userId]);
    if (!$stmt->fetch()) { http_response_code(403); echo json_encode(['error' => 'Không có quyền']); exit; }
    if (empty($_FILES['files'])) { http_response_code(400); echo json_encode(['error' => 'Không có file']); exit; }

    $uploaded = [];
    $files = $_FILES['files'];
    $count = is_array($files['name']) ? count($files['name']) : 1;
    $allowed = ['image/jpeg','image/png','image/gif','image/webp'];

    for ($i = 0; $i < $count; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmp  = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $type = is_array($files['type']) ? $files['type'][$i] : $files['type'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $err  = is_array($files['error']) ? $files['error'][$i] : $files['error'];

        if ($err !== UPLOAD_ERR_OK || !in_array($type, $allowed) || $size > 5242880) continue;

        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $safe = uniqid('att_') . '.' . $ext;
        if (move_uploaded_file($tmp, $uploadDir . $safe)) {
            $stmt = $pdo->prepare('INSERT INTO note_attachments (note_id,file_name,file_path,file_type,file_size) VALUES (?,?,?,?,?)');
            $stmt->execute([$noteId, $name, $safe, $type, $size]);
            $uploaded[] = ['id'=>(int)$pdo->lastInsertId(),'file_name'=>$name,'file_path'=>$safe,'file_type'=>$type,'file_size'=>$size];
        }
    }
    echo json_encode(['success' => true, 'attachments' => $uploaded]);
    exit;
}

if ($method === 'DELETE') {
    $attId = intval($_GET['id'] ?? 0);
    if (!$attId) { http_response_code(400); echo json_encode(['error' => 'id bắt buộc']); exit; }
    $stmt = $pdo->prepare('SELECT a.file_path FROM note_attachments a INNER JOIN notes n ON n.id=a.note_id WHERE a.id=? AND n.user_id=?');
    $stmt->execute([$attId, $userId]);
    $att = $stmt->fetch();
    if (!$att) { http_response_code(403); echo json_encode(['error' => 'Không quyền']); exit; }
    $path = $uploadDir . $att['file_path'];
    if (file_exists($path)) unlink($path);
    $pdo->prepare('DELETE FROM note_attachments WHERE id=?')->execute([$attId]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
