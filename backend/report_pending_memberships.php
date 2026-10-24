<?php

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once __DIR__ . "/db.php";

// --------------------------------------------------
// REQUEST METHOD
// --------------------------------------------------

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "POST method required."
    ]);

    exit;
}

// --------------------------------------------------
// READ JSON REQUEST
// --------------------------------------------------

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON request."
    ]);

    exit;
}

// --------------------------------------------------
// VALIDATE CLIENT ID
// --------------------------------------------------

$clientId = $data["client_id"] ?? "";

if (
    !is_string($clientId) ||
    !preg_match('/^[a-f0-9-]{16,64}$/i', $clientId)
) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid client ID."
    ]);

    exit;
}

// --------------------------------------------------
// VALIDATE CLIENT NAME
// --------------------------------------------------

$clientName = $data["client_name"] ?? "Unnamed Client";

if (!is_string($clientName)) {
    $clientName = "Unnamed Client";
}

$clientName = trim($clientName);

if ($clientName === "") {
    $clientName = "Unnamed Client";
}

if (function_exists("mb_substr")) {
    $clientName = mb_substr($clientName, 0, 100);
} else {
    $clientName = substr($clientName, 0, 100);
}

// --------------------------------------------------
// VALIDATE MEMBERSHIP COUNTS
// --------------------------------------------------

function validCount($value): bool
{
    if ($value === null) {
        return true;
    }

    if (
        !is_int($value) &&
        !(is_string($value) && ctype_digit($value))
    ) {
        return false;
    }

    $count = (int) $value;

    return $count >= 0 && $count <= 1000000;
}

$jsCount = $data["pending_memberships_js"] ?? null;
$dbCount = $data["pending_memberships_db"] ?? null;

if (
    !validCount($jsCount) ||
    !validCount($dbCount)
) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid membership count."
    ]);

    exit;
}

// Convert valid counts to integers while preserving null values.
$jsCount = $jsCount === null ? null : (int) $jsCount;
$dbCount = $dbCount === null ? null : (int) $dbCount;

// --------------------------------------------------
// INSERT OR UPDATE MEMBERSHIP QUEUE REPORT
// --------------------------------------------------

try {
    $stmt = $conn->prepare("
        INSERT INTO membership_queue_reports (
            client_id,
            client_name,
            pending_memberships_js,
            pending_memberships_db
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            client_name = VALUES(client_name),
            pending_memberships_js = VALUES(pending_memberships_js),
            pending_memberships_db = VALUES(pending_memberships_db),
            last_reported_at = CURRENT_TIMESTAMP
    ");

    if (!$stmt) {
        throw new Exception("Could not prepare report query.");
    }

    // s = string, s = string, i = integer, i = integer
    $stmt->bind_param(
        "ssii",
        $clientId,
        $clientName,
        $jsCount,
        $dbCount
    );

    $stmt->execute();
    $stmt->close();

    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "Membership report saved."
    ]);

} catch (Throwable $error) {
    error_log(
        "Membership queue report error: " . $error->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Could not save membership report."
    ]);

    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}

?>
