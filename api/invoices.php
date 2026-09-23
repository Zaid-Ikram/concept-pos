<?php
require_once 'config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['cai_invoice_no'], $data['total_amount'])) {
        echo json_encode(["error" => "Invalid invoice data"]);
        exit();
    }

    try {
        $conn->beginTransaction();

        // 1. Insert Invoice
        $stmt = $conn->prepare("INSERT INTO invoices (cai_invoice_no, customer_id, vehicle_id, total_amount, discount, service_charges, paid_amount, pending_amount, payment_method, payment_due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['cai_invoice_no'],
            $data['customer_id'] ?? null,
            $data['vehicle_id'] ?? null,
            $data['total_amount'],
            $data['discount'] ?? 0,
            $data['service_charges'] ?? 0,
            $data['paid_amount'] ?? 0,
            $data['pending_amount'] ?? 0,
            $data['payment_method'] ?? 'Cash',
            $data['payment_due_date'] ?? null
        ]);
        
        $invoice_id = $conn->lastInsertId();

        // 2. Insert Invoice Items & Deduct Stock
        foreach ($data['items'] as $item) {
            $stmtItem = $conn->prepare("INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
            $stmtItem->execute([$invoice_id, $item['product_id'], $item['quantity'], $item['unit_price'], $item['total']]);

            // Deduct stock (Logic for oil vs regular items)
            // Note: Real logic should check if it's oil and deduct stock_ml based on liters used.
            // For simplicity, we deduct stock_qty here.
            $stmtStock = $conn->prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?");
            $stmtStock->execute([$item['quantity'], $item['product_id']]);
        }

        // 3. Update Customer Pending Balance (if not walk-in)
        if ($data['customer_id'] && $data['pending_amount'] > 0) {
            $stmtCust = $conn->prepare("UPDATE customers SET total_purchases = total_purchases + ?, total_pending = total_pending + ? WHERE id = ?");
            $stmtCust->execute([$data['total_amount'], $data['pending_amount'], $data['customer_id']]);
        }

        $conn->commit();
        echo json_encode(["message" => "Invoice created successfully", "invoice_id" => $invoice_id]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["error" => "Failed to create invoice: " . $e->getMessage()]);
    }
}
?>