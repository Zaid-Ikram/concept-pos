<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['vehicle_id'])) {
            $stmt = $conn->prepare("SELECT * FROM oil_changes WHERE vehicle_id = ? ORDER BY service_date DESC");
            $stmt->execute([$_GET['vehicle_id']]);
        } else {
            $stmt = $conn->query("SELECT * FROM oil_changes ORDER BY service_date DESC LIMIT 200");
        }
        respond($stmt->fetchAll());
    }

    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);
        if (empty($data['vehicle_id'])) respond(["error" => "Vehicle ID required"], 400);

        $oilUsedMl = (int)($data['oil_used_ml'] ?? 0);
        $interval = (int)($data['interval_km'] ?? 5000);
        $currentMileage = (int)($data['current_mileage'] ?? 0);

        $stmt = $conn->prepare("INSERT INTO oil_changes
            (vehicle_id, invoice_id, oil_product_id, oil_used_ml, remaining_oil_ml,
             estimated_waste_ml, actual_waste_ml, current_mileage, interval_km,
             next_change_mileage, next_change_date, service_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $nextMileage = $currentMileage + $interval;
        $stmt->execute([
            $data['vehicle_id'],
            $data['invoice_id'] ?? null,
            $data['oil_product_id'] ?? null,
            $oilUsedMl,
            (int)($data['remaining_oil_ml'] ?? 0),
            (int)($data['estimated_waste_ml'] ?? round($oilUsedMl * 0.95)),
            isset($data['actual_waste_ml']) ? (int)$data['actual_waste_ml'] : null,
            $currentMileage,
            $interval,
            $nextMileage,
            $data['next_change_date'] ?? null,
            $data['service_date'] ?? date('Y-m-d'),
            $data['notes'] ?? null,
        ]);

        respond(["message" => "Oil change recorded", "id" => (int)$conn->lastInsertId()], 201);
    }

    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) respond(["error" => "ID required"], 400);

        $stmt = $conn->prepare("DELETE FROM oil_changes WHERE id = ?");
        $stmt->execute([$id]);
        respond(["message" => "Oil change deleted"]);
    }

    else {
        respond(["error" => "Method not allowed"], 405);
    }

} catch (PDOException $e) {
    respond(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    respond(["error" => "Server error: " . $e->getMessage()], 500);
}
?>