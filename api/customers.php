<?php
require_once 'config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM customers ORDER BY name ASC");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO customers (name, phone, whatsapp, address) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['name'], $data['phone'], $data['whatsapp'], $data['address']]);
    echo json_encode(["message" => "Customer created", "id" => $conn->lastInsertId()]);
}
?>