<?php
require_once __DIR__ . '/config/db.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $invoice = $stmt->fetch();
            if (!$invoice) respond(null);

            $stmt = $conn->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
            $stmt->execute([$invoice['id']]);
            $invoice['items'] = $stmt->fetchAll();

            $stmt = $conn->prepare("SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY date ASC");
            $stmt->execute([$invoice['id']]);
            $invoice['payments'] = $stmt->fetchAll();

            respond($invoice);
        } else {
            $stmt = $conn->query("SELECT * FROM invoices ORDER BY created_at DESC");
            respond($stmt->fetchAll());
        }
    }

    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);
        if (empty($data['invoice_no'])) respond(["error" => "Invoice number required"], 400);

        $conn->beginTransaction();

        $stmt = $conn->prepare("INSERT INTO invoices
            (invoice_no, cai_invoice_no, reg_invoice_no, customer_id, vehicle_id,
             customer_name, customer_phone, customer_address, vehicle_no, vehicle_model,
             total_amount, discount, service_charges, previous_pending,
             paid_amount, pending_amount, payment_method, payment_due_date,
             current_odometer, next_oil_change, dock_station, service_man_1, service_man_2, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $data['invoice_no'],
            $data['cai_invoice_no'] ?? null,
            $data['reg_invoice_no'] ?? null,
            $data['customer_id'] ?? null,
            $data['vehicle_id'] ?? null,
            $data['customer_name'] ?? null,
            $data['customer_phone'] ?? null,
            $data['customer_address'] ?? null,
            $data['vehicle'] ?? null,
            $data['vehicleModel'] ?? null,
            (float)($data['total_amount'] ?? 0),
            (float)($data['discount'] ?? 0),
            (float)($data['service_charges'] ?? 0),
            (float)($data['previous_pending'] ?? 0),
            (float)($data['paid_amount'] ?? 0),
            (float)($data['pending_amount'] ?? 0),
            $data['payment_method'] ?? 'Cash',
            $data['payment_due_date'] ?? null,
            $data['current_odometer'] ?? null,
            $data['next_oil_change'] ?? null,
            $data['dock_station'] ?? null,
            $data['service_man_1'] ?? null,
            $data['service_man_2'] ?? null,
            $data['notes'] ?? null,
        ]);

        $invoiceId = (int)$conn->lastInsertId();

        // Invoice items
        if (!empty($data['items']) && is_array($data['items'])) {
            $stmtItem = $conn->prepare("INSERT INTO invoice_items
                (invoice_id, product_id, product_name, quantity, unit, unit_price, discounted_price, total, oil_used_l, mileage, next_interval_km)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $it) {
                $stmtItem->execute([
                    $invoiceId,
                    $it['product_id'] ?? null,
                    $it['name'] ?? $it['product_name'] ?? '',
                    (float)($it['qty'] ?? 1),
                    $it['unit'] ?? 'pcs',
                    (float)($it['price'] ?? $it['unit_price'] ?? 0),
                    (float)($it['discountedPrice'] ?? $it['discounted_price'] ?? 0),
                    (float)($it['total'] ?? 0),
                    isset($it['oilUsedL']) ? (float)$it['oilUsedL'] : null,
                    $it['mileage'] ?? null,
                    $it['interval'] ?? null,
                ]);
            }
        }

        // Initial payment record
        $paid = (float)($data['paid_amount'] ?? 0);
        if ($paid > 0) {
            $stmtPay = $conn->prepare("INSERT INTO invoice_payments (invoice_id, date, amount, method, notes)
                VALUES (?, CURDATE(), ?, ?, ?)");
            $stmtPay->execute([$invoiceId, $paid, $data['payment_method'] ?? 'Cash', 'Initial payment']);
        }

        $conn->commit();
        respond(["message" => "Invoice created", "id" => $invoiceId], 201);
    }

    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) respond(["error" => "Invalid JSON"], 400);

        $id = $data['id'] ?? null;
        if (!$id) respond(["error" => "ID is required"], 400);

        // Record a payment update
        if (isset($data['payment_amount'])) {
            $amt = (float)$data['payment_amount'];
            if ($amt <= 0) respond(["error" => "Payment amount must be > 0"], 400);

            $conn->beginTransaction();

            // Insert payment record
            $stmtPay = $conn->prepare("INSERT INTO invoice_payments (invoice_id, date, amount, method, notes)
                VALUES (?, ?, ?, ?, ?)");
            $stmtPay->execute([
                $id,
                $data['payment_date'] ?? date('Y-m-d'),
                $amt,
                $data['payment_method'] ?? 'Cash',
                $data['notes'] ?? 'Partial payment',
            ]);

            // Update invoice paid + pending
            $stmtUpd = $conn->prepare("UPDATE invoices
                SET paid_amount = paid_amount + ?,
                    pending_amount = GREATEST(0, pending_amount - ?)
                WHERE id = ?");
            $stmtUpd->execute([$amt, $amt, $id]);

            // Update customer total_pending
            if (!empty($data['customer_id'])) {
                $stmtCust = $conn->prepare("UPDATE customers
                    SET total_pending = GREATEST(0, total_pending - ?)
                    WHERE id = ?");
                $stmtCust->execute([$amt, $data['customer_id']]);
            }

            $conn->commit();
            respond(["message" => "Payment recorded"]);
        }

        respond(["error" => "No valid update fields"], 400);
    }

    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) respond(["error" => "ID is required"], 400);

        $stmt = $conn->prepare("DELETE FROM invoices WHERE id = ?");
        $stmt->execute([$id]);
        respond(["message" => "Invoice deleted"]);
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