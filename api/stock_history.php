<?php
require_once 'config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['product_id'])) {
        $stmt = $conn->prepare("SELECT * FROM stock_history WHERE product_id = ? ORDER BY created_at DESC LIMIT 100");
        $stmt->execute([$_GET['product_id']]);
    } else {
        $stmt = $conn->prepare("SELECT * FROM stock_history ORDER BY created_at DESC LIMIT 500");
        $stmt->execute();
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO stock_history (product_id, product_name, date, type, qty, reference, user) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['product_id'], $data['product_name'] ?? '',
        $data['date'], $data['type'], $data['qty'],
        $data['reference'] ?? '', $data['user'] ?? 'Admin'
    ]);
    echo json_encode(["message" => "History added"]);
}
?>