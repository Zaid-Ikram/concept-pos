<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$db_name = "concept_autos_pos";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed: " . $e->getMessage()]);
    exit();
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $entries = [];

        // 1. From invoices — cash in (paid_amount) + pending
        $stmt = $conn->query("SELECT i.*, c.name as customer_name, v.reg_no as vehicle_no
                              FROM invoices i
                              LEFT JOIN customers c ON i.customer_id = c.id
                              LEFT JOIN vehicles v ON i.vehicle_id = v.id
                              ORDER BY i.created_at DESC");
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

        // 2. From waste_oil — cash in
        $stmt = $conn->query("SELECT * FROM waste_oil ORDER BY created_at DESC");
        $waste = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($waste as $w) {
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

        // 3. From ledger table (custom entries, e.g. supplier payments recorded manually)
        try {
            $stmt = $conn->query("SELECT * FROM ledger ORDER BY date DESC, id DESC");
            $custom = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($custom as $c) {
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
            // ledger table doesn't exist — that's fine, skip
        }

        // Sort by date DESC
        usort($entries, function($a, $b) {
            return strtotime($b['sortDate'] ?? $b['date']) - strtotime($a['sortDate'] ?? $a['date']);
        });

        respond($entries);
    }

    elseif ($method === 'POST') {
        // Add a custom ledger entry
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