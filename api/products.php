<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            respond($stmt->fetch() ?: null);
        } else {
            $stmt = $conn->query("SELECT * FROM products ORDER BY name ASC");
            respond($stmt->fetchAll());
        }
    }

    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON body"], 400);
        if (empty($data['name'])) respond(["error" => "Name is required"], 400);

        $stmt = $conn->prepare("INSERT INTO products
            (name, category, purchase_price, wholesale_price, sale_price,
             stock_qty, stock_ml, min_stock_level, rack, shelf, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $data['name'],
            $data['category'] ?? '',
            $data['purchase_price'] ?? 0,
            $data['wholesale_price'] ?? 0,
            $data['sale_price'] ?? 0,
            max(0, (int)($data['stock_qty'] ?? 0)),
            max(0, (int)($data['stock_ml'] ?? 0)),
            $data['min_stock_level'] ?? 5,
            $data['rack'] ?? '',
            $data['shelf'] ?? '',
            $data['unit'] ?? 'pcs',
        ]);

        respond(["message" => "Product created", "id" => (int)$conn->lastInsertId()], 201);
    }

    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON body"], 400);

        $id = $data['id'] ?? null;
        if (!$id) respond(["error" => "ID is required"], 400);

        // Stock-only update (from POS)
        if (isset($data['quantity_sold']) || isset($data['oil_used_ml'])) {
            $stmt = $conn->prepare("UPDATE products
                SET stock_qty = GREATEST(0, stock_qty - ?),
                    stock_ml  = GREATEST(0, stock_ml - ?)
                WHERE id = ?");
            $stmt->execute([
                (int)($data['quantity_sold'] ?? 0),
                (int)($data['oil_used_ml'] ?? 0),
                $id,
            ]);
            respond(["message" => "Stock updated"]);
        }

        // Full update
        $stmt = $conn->prepare("UPDATE products SET
            name = ?, category = ?,
            purchase_price = ?, wholesale_price = ?, sale_price = ?,
            stock_qty = ?, stock_ml = ?, min_stock_level = ?,
            rack = ?, shelf = ?, unit = ?
            WHERE id = ?");

        $stmt->execute([
            $data['name'],
            $data['category'] ?? '',
            $data['purchase_price'] ?? 0,
            $data['wholesale_price'] ?? 0,
            $data['sale_price'] ?? 0,
            max(0, (int)($data['stock_qty'] ?? 0)),
            max(0, (int)($data['stock_ml'] ?? 0)),
            $data['min_stock_level'] ?? 5,
            $data['rack'] ?? '',
            $data['shelf'] ?? '',
            $data['unit'] ?? 'pcs',
            $id,
        ]);

        respond(["message" => "Product updated"]);
    }

    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) respond(["error" => "ID is required"], 400);

        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        respond(["message" => "Product deleted"]);
    }

    else {
        respond(["error" => "Method not allowed: " . $method], 405);
    }

} catch (PDOException $e) {
    respond(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    respond(["error" => "Server error: " . $e->getMessage()], 500);
}
?>