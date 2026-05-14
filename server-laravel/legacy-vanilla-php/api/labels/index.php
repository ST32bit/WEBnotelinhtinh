<?php
// api/labels/index.php — CRUD Labels (Tiêu chí 15, 19)
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';

$auth   = authenticate();
$userId = $auth['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: List labels (Tiêu chí 15) ──
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM labels WHERE user_id = ? ORDER BY name ASC');
    $stmt->execute([$userId]);
    echo json_encode(['success' => true, 'labels' => $stmt->fetchAll()]);
    exit;
}

// ── POST: Create label (Tiêu chí 19) ──
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name  = trim($input['name'] ?? '');
    $color = $input['color'] ?? '#6366f1';

    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Tên label bắt buộc']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $name, $color]);
        $id = $pdo->lastInsertId();
        echo json_encode(['success'=>true, 'label'=>['id'=>(int)$id,'name'=>$name,'color'=>$color,'user_id'=>$userId]]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Label này đã tồn tại']);
        } else throw $e;
    }
    exit;
}

// ── PUT: Update label (Tiêu chí 19) ──
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id    = intval($input['id'] ?? 0);
    $name  = trim($input['name'] ?? '');
    $color = $input['color'] ?? null;

    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID và tên bắt buộc']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id FROM labels WHERE id=? AND user_id=?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Không có quyền']);
        exit;
    }

    $fields = ['name = ?'];
    $params = [$name];
    if ($color) { $fields[] = 'color = ?'; $params[] = $color; }
    $params[] = $id;

    $pdo->prepare('UPDATE labels SET ' . implode(',', $fields) . ' WHERE id=?')->execute($params);
    echo json_encode(['success'=>true, 'label'=>['id'=>$id,'name'=>$name,'color'=>$color ?? '#6366f1']]);
    exit;
}

// ── DELETE: Delete label (Tiêu chí 19) ──
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error'=>'ID bắt buộc']); exit; }

    $stmt = $pdo->prepare('SELECT id FROM labels WHERE id=? AND user_id=?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) { http_response_code(403); echo json_encode(['error'=>'Không quyền']); exit; }

    $pdo->prepare('DELETE FROM labels WHERE id=?')->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
