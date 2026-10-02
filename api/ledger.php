<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $entries = [];

        // 1. Invoices → cash in + pending
        $stmt = $conn->query("SELECT i.*, c.name as customer_name, v.reg_no as vehicle_no
                              FROM invoices i
                              LEFT JOIN customers c ON i.customer_id = c.id
                              LEFT JOIN vehicles v ON i.vehicle_id = v.id
                              ORDER BY i.created_at DESC");
        $invoices = $stmt->fetchAll();

        foreach ($invoices as $inv) {
            $paid = (float)($inv['paid_amount'] ?? 0);
            $pending = (float)($inv['pending_amount'] ?? 0);

            if ($paid > 0) {
                $entries[] = [
                    "id" => "inv-paid-" . $inv['id'],
                    "date" => date("d M Y", strtotime($inv['created_at'])),
                    "sortDate" => $inv['created_at'],
                    "type" => "Sale",
                    "category" => "Cash In",
                    "description" => "Invoice " . $inv['invoice_no'] . " — " . ($inv['customer_name'] ?: "Walk-in"),
                    "ref" => $inv['invoice_no'],
                    "direction" => "in",
                    "amount" => $paid,
                ];
            }
            if ($pending > 0) {
                $entries[] = [
                    "id" => "inv-pend-" . $inv['id'],
                    "date" => date("d M Y", strtotime($inv['created_at'])),
                    "sortDate" => $inv['created_at'],
                    "type" => "Receivable",
                    "category" => "Pending",
                    "description" => "Pending — " . ($inv['customer_name'] ?: "Walk-in"),
                    "ref" => $inv['invoice_no'],
                    "direction" => "pending",
                    "amount" => $pending,
                ];
            }
        }

        // 2. Waste oil sales → cash in
        $stmt = $conn->query("SELECT * FROM waste_oil ORDER BY created_at DESC");
        foreach ($stmt->fetchAll() as $w) {
            if ($w['source'] === 'Sale' && (float)($w['quantity_ml'] ?? 0) > 0) {
                $entries[] = [
                    "id" => "waste-" . $w['id'],
                    "date" => date("d M Y", strtotime($w['date'])),
                    "sortDate" => $w['date'],
                    "type" => "Waste Oil Sale",
                    "category" => "Cash In",
                    "description" => $w['notes'] ?: "Sold waste oil",
                    "ref" => (string)$w['id'],
                    "direction" => "in",
                    "amount" => (float)($w['amount'] ?? 0),
                ];
            }
        }

        // 3. Custom ledger entries (skip if table missing)
        try {
            $stmt = $conn->query("SELECT * FROM ledger ORDER BY date DESC, id DESC");
            foreach ($stmt->fetchAll() as $c) {
                $entries[] = [
                    "id" => "custom-" . $c['id'],
                    "date" => date("d M Y", strtotime($c['date'])),
                    "sortDate" => $c['date'],
                    "type" => $c['type'],
                    "category" => $c['category'],
                    "description" => $c['description'],
                    "ref" => $c['reference'],
                    "direction" => $c['direction'],
                    "amount" => (float)$c['amount'],
                ];
            }
        } catch (PDOException $e) {
            // ledger table doesn't exist — skip silently
        }

        usort($entries, function($a, $b) {
            return strtotime($b['sortDate'] ?? $b['date']) - strtotime($a['sortDate'] ?? $a['date']);
        });

        respond($entries);
    }

    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);

        $stmt = $conn->prepare("INSERT INTO ledger (date, type, category, description, reference, direction, amount)
                                VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['date'] ?? date("Y-m-d"),
            $data['type'] ?? 'Manual',
            $data['category'] ?? 'Adjustment',
            $data['description'] ?? '',
            $data['reference'] ?? '',
            $data['direction'] ?? 'in',
            (float)($data['amount'] ?? 0),
        ]);
        respond(["message" => "Ledger entry added", "id" => (int)$conn->lastInsertId()], 201);
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