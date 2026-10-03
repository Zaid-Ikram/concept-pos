<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['key'])) {
            $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
            $stmt->execute([$_GET['key']]);
            $row = $stmt->fetch();
            respond($row ? ["key" => $_GET['key'], "value" => $row['setting_value']] : null);
        } else {
            $stmt = $conn->query("SELECT setting_key, setting_value FROM settings ORDER BY setting_key ASC");
            $rows = $stmt->fetchAll();
            $out = [];
            foreach ($rows as $r) $out[$r['setting_key']] = $r['setting_value'];
            respond($out);
        }
    }

    elseif ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);

        $conn->beginTransaction();
        $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

        foreach ($data as $key => $value) {
            $stmt->execute([$key, is_array($value) ? json_encode($value) : (string)$value]);
        }
        $conn->commit();
        respond(["message" => "Settings saved", "updated" => count($data)]);
    }

    else {
        respond(["error" => "Method not allowed"], 405);
    }

} catch (PDOException $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    respond(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    respond(["error" => "Server error: " . $e->getMessage()], 500);
}
?>