
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
$requestId = $input["request_id"] ?? null;

if (
    !is_string($token) ||
    !preg_match('/\A[a-f0-9]{64}\z/i', $token)
) {
    respond(400, [
        "success" => false,
        "message" => "Invalid QR code."
    ]);
}

// Request IDs are optional for backward compatibility.
if ($requestId !== null) {
    if (
        !is_string($requestId) ||
        !preg_match(
            '/\A[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/i',
            $requestId
        )
    ) {
        respond(400, [
            "success" => false,
            "message" => "Invalid check-in request ID."
        ]);
    }
}

try {
    // Find the member associated with the QR token.
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

    $memberId = (int) $member["member_id"];

    // An already-processed request must return its original result.
    // This check comes before expiry and daily-duplicate checks so a
    // retry after a lost response does not create a second check-in.
    if ($requestId !== null) {
        $stmt = $conn->prepare("
            SELECT checkin_id, member_id, checkin_date, time_in
            FROM check_ins
            WHERE offline_request_id = ?
            LIMIT 1
        ");

        $stmt->bind_param("s", $requestId);
        $stmt->execute();
        $existingRequest = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($existingRequest) {
            if ((int) $existingRequest["member_id"] !== $memberId) {
                respond(409, [
                    "success" => false,
                    "message" => "This request ID belongs to another check-in."
                ]);
            }

            respond(200, [
                "success" => true,
                "message" => "This check-in was already recorded.",
                "member_name" => $member["name"],
                "checkin_id" => (int) $existingRequest["checkin_id"],
                "checkin_date" => $existingRequest["checkin_date"],
                "time_in" => $existingRequest["time_in"],
                "already_recorded" => true
            ]);
        }
    }

    // Only allow members whose membership has not expired.
    $today = date("Y-m-d");

    if ($member["expiration_date"] < $today) {
        respond(403, [
            "success" => false,
            "message" => "Membership has expired."
        ]);
    }

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

    $timeIn = date("H:i:s");

    // Save the request ID when provided. Legacy online requests can
    // continue without one and will store NULL in this column.
    $stmt = $conn->prepare("
        INSERT INTO check_ins
            (member_id, checkin_date, time_in, time_out, offline_request_id)
        VALUES (?, ?, ?, NULL, ?)
    ");

    $stmt->bind_param("isss", $memberId, $today, $timeIn, $requestId);
    $stmt->execute();

    $checkinId = $conn->insert_id;
    $stmt->close();

    respond(201, [
        "success" => true,
        "message" => "Check-in successful!",
        "member_name" => $member["name"],
        "checkin_id" => $checkinId,
        "checkin_date" => $today,
        "time_in" => $timeIn,
        "already_recorded" => false
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    // If simultaneous retries raced to insert the same request ID,
    // return the original result if the first insert succeeded.
    if (isset($requestId) && is_string($requestId)) {
        try {
            $stmt = $conn->prepare("
                SELECT c.checkin_id, c.member_id, c.checkin_date, c.time_in,
                       m.name
                FROM check_ins c
                JOIN members m ON m.member_id = c.member_id
                WHERE c.offline_request_id = ?
                LIMIT 1
            ");

            $stmt->bind_param("s", $requestId);
            $stmt->execute();
            $saved = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if ($saved) {
                $stmt = $conn->prepare("
                    SELECT member_id FROM members WHERE qr_token = ? LIMIT 1
                ");
                $stmt->bind_param("s", $token);
                $stmt->execute();
                $tokenMember = $stmt->get_result()->fetch_assoc();
                $stmt->close();

                if (
                    $tokenMember &&
                    (int) $tokenMember["member_id"] === (int) $saved["member_id"]
                ) {
                    respond(200, [
                        "success" => true,
                        "message" => "This check-in was already recorded.",
                        "member_name" => $saved["name"],
                        "checkin_id" => (int) $saved["checkin_id"],
                        "checkin_date" => $saved["checkin_date"],
                        "time_in" => $saved["time_in"],
                        "already_recorded" => true
                    ]);
                }
            }
        } catch (Throwable $retryError) {
            error_log($retryError->getMessage());
        }
    }

    respond(500, [
        "success" => false,
        "message" => "A server error occurred. Please try again."
    ]);
}
?>
