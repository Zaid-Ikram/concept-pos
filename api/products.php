<?php
require_once 'config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch all products
    $stmt = $conn->prepare("SELECT * FROM products ORDER BY name ASC");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($products);
} 
elseif ($method === 'POST') {
    // Add new product
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['sku'], $data['name'], $data['sale_price'])) {
        $stmt = $conn->prepare("INSERT INTO products (sku, name, category, purchase_price, wholesale_price, sale_price, stock_qty, stock_ml, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['sku'], $data['name'], $data['category'] ?? '', 
            $data['purchase_price'] ?? 0, $data['wholesale_price'] ?? 0, 
            $data['sale_price'], $data['stock_qty'] ?? 0, 
            $data['stock_ml'] ?? 0, $data['min_stock_level'] ?? 5
        ]);
        echo json_encode(["message" => "Product created successfully", "id" => $conn->lastInsertId()]);
    } else {
        echo json_encode(["error" => "Invalid input"]);
    }
}
?>