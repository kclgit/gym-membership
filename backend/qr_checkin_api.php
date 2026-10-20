
<?php
require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set("Asia/Manila");

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    respond(405, [
        "success" => false,
        "message" => "Use POST to scan a QR code."
    ]);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    respond(400, [
        "success" => false,
        "message" => "Invalid request data."
    ]);
}

$token = $input["qr_token"] ?? "";

if (
    !is_string($token) ||
    !preg_match('/\A[a-f0-9]{64}\z/i', $token)
) {
    respond(400, [
        "success" => false,
        "message" => "Invalid QR code."
    ]);
}

try {
    // Find the member associated with this QR token.
    $stmt = $conn->prepare("
        SELECT member_id, name, expiration_date
        FROM members
        WHERE qr_token = ?
        LIMIT 1
    ");

    $stmt->bind_param("s", $token);
    $stmt->execute();

    $member = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$member) {
        respond(404, [
            "success" => false,
            "message" => "QR code not recognized."
        ]);
    }

    // Only allow members whose membership has not expired.
    $today = date("Y-m-d");

    if ($member["expiration_date"] < $today) {
        respond(403, [
            "success" => false,
            "message" => "Membership has expired."
        ]);
    }

    $memberId = (int) $member["member_id"];

    // Prevent multiple check-ins for the same member on the same day.
    $stmt = $conn->prepare("
        SELECT checkin_id
        FROM check_ins
        WHERE member_id = ? AND checkin_date = ?
        LIMIT 1
    ");

    $stmt->bind_param("is", $memberId, $today);
    $stmt->execute();

    $alreadyCheckedIn = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($alreadyCheckedIn) {
        respond(409, [
            "success" => false,
            "message" => "This member has already checked in today.",
            "member_name" => $member["name"]
        ]);
    }

    // Record the check-in using the server's current date and time.
    $timeIn = date("H:i:s");

    $stmt = $conn->prepare("
        INSERT INTO check_ins
            (member_id, checkin_date, time_in, time_out)
        VALUES (?, ?, ?, NULL)
    ");

    $stmt->bind_param("iss", $memberId, $today, $timeIn);
    $stmt->execute();

    $checkinId = $conn->insert_id;
    $stmt->close();

    respond(201, [
        "success" => true,
        "message" => "Check-in successful!",
        "member_name" => $member["name"],
        "checkin_id" => $checkinId,
        "checkin_date" => $today,
        "time_in" => $timeIn
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    respond(500, [
        "success" => false,
        "message" => "A server error occurred. Please try again."
    ]);
}
?>
