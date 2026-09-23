<?php
require_once 'config/db.php';
$stmt = $conn->prepare("SELECT * FROM vehicles ORDER BY reg_no ASC");
$stmt->execute();
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>