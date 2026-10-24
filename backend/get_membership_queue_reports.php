<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "GET requests only."
    ]);
    exit;
}

$sql = "
    SELECT
        client_id,
        client_name,
        pending_memberships_js,
        pending_memberships_db,
        last_reported_at
    FROM membership_queue_reports
    ORDER BY last_reported_at DESC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not retrieve membership queue reports."
    ]);
    $conn->close();
    exit;
}

$reports = [];

while ($row = $result->fetch_assoc()) {
    $reports[] = [
    "client_id" => $row["client_id"],
    "client_name" => $row["client_name"],
    "pending_memberships_js" =>
        $row["pending_memberships_js"] === null
            ? null
            : (int) $row["pending_memberships_js"],
    "pending_memberships_db" =>
        $row["pending_memberships_db"] === null
            ? null
            : (int) $row["pending_memberships_db"],
    "last_reported_at" => $row["last_reported_at"]
    ];
}

echo json_encode([
    "success" => true,
    "reports" => $reports
]);

$result->free();
$conn->close();
?>
