<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $conn->query("SELECT * FROM suppliers ORDER BY name ASC");
        $suppliers = $stmt->fetchAll();

        // Attach payments to each supplier
        foreach ($suppliers as &$s) {
            $stmtP = $conn->prepare("SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY date DESC");
            $stmtP->execute([$s['id']]);
            $s['payments'] = $stmtP->fetchAll();
        }
        respond($suppliers);
    }

    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);
        if (empty($data['name'])) respond(["error" => "Name is required"], 400);

        $stmt = $conn->prepare("INSERT INTO suppliers (name, contact, address, total_purchases, notes)
            VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['contact'] ?? null,
            $data['address'] ?? null,
            (float)($data['totalPurchases'] ?? $data['total_purchases'] ?? 0),
            $data['notes'] ?? null,
        ]);
        respond(["message" => "Supplier created", "id" => (int)$conn->lastInsertId()], 201);
    }

    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        if (!$id) respond(["error" => "ID required"], 400);

        // Record a payment
        if (isset($data['payment_amount'])) {
            $amt = (float)$data['payment_amount'];
            if ($amt <= 0) respond(["error" => "Amount must be > 0"], 400);

            $conn->beginTransaction();

            $stmt = $conn->prepare("INSERT INTO supplier_payments (supplier_id, date, amount, method, notes)
                VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $data['date'] ?? date('Y-m-d'),
                $amt,
                $data['method'] ?? 'Cash',
                $data['notes'] ?? '',
            ]);

            $stmt = $conn->prepare("UPDATE suppliers SET paid = paid + ? WHERE id = ?");
            $stmt->execute([$amt, $id]);

            $conn->commit();
            respond(["message" => "Payment recorded"]);
        }

        // Full update
        $stmt = $conn->prepare("UPDATE suppliers SET name = ?, contact = ?, address = ?, total_purchases = ?, notes = ? WHERE id = ?");
        $stmt->execute([
            $data['name'],
            $data['contact'] ?? null,
            $data['address'] ?? null,
            (float)($data['totalPurchases'] ?? $data['total_purchases'] ?? 0),
            $data['notes'] ?? null,
            $id,
        ]);
        respond(["message" => "Supplier updated"]);
    }

    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) respond(["error" => "ID required"], 400);

        $stmt = $conn->prepare("DELETE FROM suppliers WHERE id = ?");
        $stmt->execute([$id]);
        respond(["message" => "Supplier deleted"]);
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