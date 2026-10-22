
<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/db.php";

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, [
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    respond(400, [
        "success" => false,
        "message" => "Invalid form data."
    ]);
}

$fullName = trim($input["full_name"] ?? "");
$address = trim($input["address"] ?? "");
$contactNo = trim($input["contact_no"] ?? "");
$emergencyContact = trim($input["emergency_contact_no"] ?? "");
$membershipType = trim($input["membership_type"] ?? "");
$startingDate = $input["starting_date"] ?? "";
$offlineId = trim($input["offline_id"] ?? "");

$allowedPlans = [
    "Promo" => 1,
    "Regular" => 2,
    "Premium" => 3
];

if (
    $fullName === "" ||
    $address === "" ||
    $contactNo === "" ||
    $emergencyContact === "" ||
    !isset($allowedPlans[$membershipType])
) {
    respond(422, [
        "success" => false,
        "message" => "Please complete all fields and select a valid plan."
    ]);
}

if (
    strlen($fullName) > 150 ||
    strlen($address) > 255 ||
    strlen($contactNo) > 20 ||
    strlen($emergencyContact) > 20
) {
    respond(422, [
        "success" => false,
        "message" => "One or more fields exceed the allowed length."
    ]);
}

$phonePattern = '/^[0-9+() -]{7,20}$/';

if (
    !preg_match($phonePattern, $contactNo) ||
    !preg_match($phonePattern, $emergencyContact)
) {
    respond(422, [
        "success" => false,
        "message" => "Please enter valid contact numbers."
    ]);
}

// Validate the starting date.
$date = DateTimeImmutable::createFromFormat("!Y-m-d", $startingDate);
$dateErrors = DateTimeImmutable::getLastErrors();

if (
    !$date ||
    ($dateErrors !== false &&
        ($dateErrors["warning_count"] > 0 ||
         $dateErrors["error_count"] > 0)) ||
    $date->format("Y-m-d") !== $startingDate
) {
    respond(422, [
        "success" => false,
        "message" => "Please enter a valid starting date."
    ]);
}

if ($date < new DateTimeImmutable("today")) {
    respond(422, [
        "success" => false,
        "message" => "The starting date cannot be in the past."
    ]);
}

// Calculate one calendar month, clamping the day when necessary.
$nextMonth = $date->modify("first day of next month");
$lastDay = (int) $nextMonth->format("t");
$day = min((int) $date->format("d"), $lastDay);

$expirationDate = $nextMonth
    ->setDate(
        (int) $nextMonth->format("Y"),
        (int) $nextMonth->format("m"),
        $day
    )
    ->format("Y-m-d");

$membershipTypeId = $allowedPlans[$membershipType];

// Validate the optional idempotency key.
if ($offlineId !== "") {
    if (
        strlen($offlineId) > 100 ||
        !preg_match('/^[a-zA-Z0-9_-]+$/', $offlineId)
    ) {
        respond(422, [
            "success" => false,
            "message" => "Invalid offline registration ID."
        ]);
    }
}

try {
    // If this request was already processed, report success without
    // inserting another member.
    if ($offlineId !== "") {
        $check = $conn->prepare(
            "SELECT member_id FROM members WHERE offline_id = ?"
        );

        $check->bind_param("s", $offlineId);
        $check->execute();

        $existing = $check->get_result()->fetch_assoc();
        $check->close();

        if ($existing) {
            respond(200, [
                "success" => true,
                "message" => "Membership was already registered.",
                "member_id" => (int) $existing["member_id"],
                "duplicate" => true
            ]);
        }
    }

    $sql = "INSERT INTO members
        (name, address, contact_no, emergency_contact_no,
         membership_type_id, starting_date, expiration_date, offline_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "ssssisss",
        $fullName,
        $address,
        $contactNo,
        $emergencyContact,
        $membershipTypeId,
        $startingDate,
        $expirationDate,
        $offlineId
    );

    $stmt->execute();
    $memberId = $conn->insert_id;
    $stmt->close();

    respond(201, [
        "success" => true,
        "message" => "Membership registered successfully.",
        "member_id" => $memberId,
        "duplicate" => false
    ]);

} catch (mysqli_sql_exception $e) {
    // Protect against two retries arriving at nearly the same time.
    // The UNIQUE constraint on offline_id is essential here.
    if ($offlineId !== "" && $e->getCode() === 1062) {
        try {
            $check = $conn->prepare(
                "SELECT member_id FROM members WHERE offline_id = ?"
            );

            $check->bind_param("s", $offlineId);
            $check->execute();

            $existing = $check->get_result()->fetch_assoc();
            $check->close();

            if ($existing) {
                respond(200, [
                    "success" => true,
                    "message" => "Membership was already registered.",
                    "member_id" => (int) $existing["member_id"],
                    "duplicate" => true
                ]);
            }
        } catch (Throwable $lookupError) {
            error_log(
                "Offline membership duplicate lookup error: " .
                $lookupError->getMessage()
            );
        }
    }

    error_log("Membership registration error: " . $e->getMessage());

    respond(500, [
        "success" => false,
        "message" => "Unable to save membership. Please try again."
    ]);

} catch (Throwable $e) {
    error_log("Membership registration error: " . $e->getMessage());

    respond(500, [
        "success" => false,
        "message" => "Unable to save membership. Please try again."
    ]);
}
?>
