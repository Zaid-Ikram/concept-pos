<?php
require_once 'config/db.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM waste_oil ORDER BY created_at DESC LIMIT 200");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $totalMl = array_sum(array_map(fn($r) => (int)$r['quantity_ml'], $rows));
    echo json_encode(["transactions" => $rows, "total_ml" => $totalMl]);
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO waste_oil (date, source, quantity_ml, reference, notes) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['date'], $data['source'] ?? 'Oil Change',
        (int)$data['quantity_ml'], $data['reference'] ?? '', $data['notes'] ?? ''
    ]);
    echo json_encode(["message" => "Waste oil recorded"]);
}
?>