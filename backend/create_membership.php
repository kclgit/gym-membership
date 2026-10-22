
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

$allowedPlans = ["Promo", "Regular", "Premium"];

if (
    $fullName === "" ||
    $address === "" ||
    $contactNo === "" ||
    $emergencyContact === "" ||
    !in_array($membershipType, $allowedPlans, true)
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

// Validate the starting date and calculate expiration on the server.
$date = DateTimeImmutable::createFromFormat("!Y-m-d", $startingDate);
$errors = DateTimeImmutable::getLastErrors();

if (
    !$date ||
    ($errors !== false &&
        ($errors["warning_count"] > 0 || $errors["error_count"] > 0)) ||
    $date->format("Y-m-d") !== $startingDate
) {
    respond(422, [
        "success" => false,
        "message" => "Please enter a valid starting date."
    ]);
}

$today = new DateTimeImmutable("today");

if ($date < $today) {
    respond(422, [
        "success" => false,
        "message" => "The starting date cannot be in the past."
    ]);
}

// Add one calendar month, clamping dates such as January 31 to February 28/29.
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

try {
    $sql = "INSERT INTO members
    (name, address, contact_no, emergency_contact_no,
     membership_type_id, starting_date, expiration_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$membershipTypeIds = [
    "Promo" => 1,
    "Regular" => 2,
    "Premium" => 3
    
];

$membershipTypeId = $membershipTypeIds[$membershipType];

$stmt->bind_param(
    "sssssis",
    $fullName,
    $address,
    $contactNo,
    $emergencyContact,
    $membershipTypeId,
    $startingDate,
    $expirationDate
);

    $stmt->execute();
    $memberId = $conn->insert_id;
    $stmt->close();

    respond(201, [
        "success" => true,
        "message" => "Membership registered successfully.",
    ]);

} catch (Throwable $e) {
    error_log("Membership registration error: " . $e->getMessage());

    respond(500, [
        "success" => false,
        "message" => "Unable to save membership. Please check the database configuration and table columns."
    ]);
}
?>
