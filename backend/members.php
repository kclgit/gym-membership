
<?php
require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER["REQUEST_METHOD"];

// Check whether a date is valid in YYYY-MM-DD format
function isValidDate($date) {
    $dateObject = DateTime::createFromFormat("!Y-m-d", $date);

    return $dateObject !== false
        && $dateObject->format("Y-m-d") === $date;
}

// Check whether the membership type exists
function membershipTypeExists($conn, $typeId) {
    $sql = "SELECT membership_type_id
            FROM membership_types
            WHERE membership_type_id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $typeId);
    $stmt->execute();

    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;

    $stmt->close();

    return $exists;
}

try {

    // READ: Get all members or one member by ID
    if ($method === "GET") {

        if (isset($_GET["id"])) {
            $id = filter_var(
                $_GET["id"],
                FILTER_VALIDATE_INT
            );

            if (!$id || $id < 1) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid member ID."
                ]);
                exit;
            }

            $sql = "SELECT m.*, mt.type_name AS membership_type_name
                    FROM members m
                    JOIN membership_types mt
                    ON m.membership_type_id = mt.membership_type_id
                    WHERE m.member_id = ?";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $result = $stmt->get_result();
            $member = $result->fetch_assoc();

            $stmt->close();

            if (!$member) {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "Member not found."
                ]);
                exit;
            }

            echo json_encode([
                "success" => true,
                "data" => $member
            ]);

        } else {
            $sql = "SELECT m.*, mt.type_name AS membership_type_name
                    FROM members m
                    JOIN membership_types mt
                    ON m.membership_type_id = mt.membership_type_id
                    ORDER BY m.name ASC";

            $result = $conn->query($sql);
            $members = [];

            while ($row = $result->fetch_assoc()) {
                $members[] = $row;
            }

            echo json_encode([
                "success" => true,
                "data" => $members
            ]);
        }
    }

    // CREATE: Add a member
    elseif ($method === "POST") {

        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON input."
            ]);
            exit;
        }

        $name = trim($input["name"] ?? "");
        $address = trim($input["address"] ?? "");
        $contact_no = trim($input["contact_no"] ?? "");
        $emergency_contact_no =
            trim($input["emergency_contact_no"] ?? "");

        $starting_date = $input["starting_date"] ?? "";
        $expiration_date = $input["expiration_date"] ?? "";

        $typeId = filter_var(
            $input["membership_type_id"] ?? null,
            FILTER_VALIDATE_INT
        );

        // Validate required fields
        if (
            $name === "" ||
            $starting_date === "" ||
            $expiration_date === "" ||
            !$typeId ||
            $typeId < 1
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Name, dates, and a valid membership type are required."
            ]);
            exit;
        }

        // Validate field lengths
        if (
            strlen($name) > 100 ||
            strlen($address) > 255 ||
            strlen($contact_no) > 30 ||
            strlen($emergency_contact_no) > 30
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "One or more fields exceed the allowed length."
            ]);
            exit;
        }

        // Validate dates
        if (
            !isValidDate($starting_date) ||
            !isValidDate($expiration_date)
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Dates must be valid and use YYYY-MM-DD format."
            ]);
            exit;
        }

        if ($expiration_date < $starting_date) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Expiration date cannot be before the starting date."
            ]);
            exit;
        }

        // Confirm membership type exists
        if (!membershipTypeExists($conn, $typeId)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Membership type does not exist."
            ]);
            exit;
        }

        // Store empty optional fields as NULL
        $address = $address === "" ? null : $address;
        $contact_no = $contact_no === "" ? null : $contact_no;
        $emergency_contact_no =
            $emergency_contact_no === ""
                ? null
                : $emergency_contact_no;

        $sql = "INSERT INTO members
                (name, address, contact_no, emergency_contact_no,
                 starting_date, expiration_date, membership_type_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssssssi",
            $name,
            $address,
            $contact_no,
            $emergency_contact_no,
            $starting_date,
            $expiration_date,
            $typeId
        );

        $stmt->execute();
        $newId = $conn->insert_id;
        $stmt->close();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Member added successfully.",
            "member_id" => $newId
        ]);
    }

    // UPDATE: Edit an existing member
    elseif ($method === "PUT") {

        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$id || $id < 1) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "A valid member ID is required in the URL."
            ]);
            exit;
        }

        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON input."
            ]);
            exit;
        }

        $name = trim($input["name"] ?? "");
        $address = trim($input["address"] ?? "");
        $contact_no = trim($input["contact_no"] ?? "");
        $emergency_contact_no =
            trim($input["emergency_contact_no"] ?? "");

        $starting_date = $input["starting_date"] ?? "";
        $expiration_date = $input["expiration_date"] ?? "";

        $typeId = filter_var(
            $input["membership_type_id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            $name === "" ||
            $starting_date === "" ||
            $expiration_date === "" ||
            !$typeId ||
            $typeId < 1
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Name, dates, and a valid membership type are required."
            ]);
            exit;
        }

        if (
            strlen($name) > 100 ||
            strlen($address) > 255 ||
            strlen($contact_no) > 30 ||
            strlen($emergency_contact_no) > 30
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "One or more fields exceed the allowed length."
            ]);
            exit;
        }

        if (
            !isValidDate($starting_date) ||
            !isValidDate($expiration_date)
        ) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Dates must be valid and use YYYY-MM-DD format."
            ]);
            exit;
        }

        if ($expiration_date < $starting_date) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Expiration date cannot be before the starting date."
            ]);
            exit;
        }

        if (!membershipTypeExists($conn, $typeId)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Membership type does not exist."
            ]);
            exit;
        }

        // Check whether this member exists
        $check = $conn->prepare(
            "SELECT member_id FROM members WHERE member_id = ?"
        );
        $check->bind_param("i", $id);
        $check->execute();

        $result = $check->get_result();
        $exists = $result->num_rows > 0;

        $check->close();

        if (!$exists) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Member not found."
            ]);
            exit;
        }

        $address = $address === "" ? null : $address;
        $contact_no = $contact_no === "" ? null : $contact_no;
        $emergency_contact_no =
            $emergency_contact_no === ""
                ? null
                : $emergency_contact_no;

        $sql = "UPDATE members
                SET name = ?,
                    address = ?,
                    contact_no = ?,
                    emergency_contact_no = ?,
                    starting_date = ?,
                    expiration_date = ?,
                    membership_type_id = ?
                WHERE member_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssssssii",
            $name,
            $address,
            $contact_no,
            $emergency_contact_no,
            $starting_date,
            $expiration_date,
            $typeId,
            $id
        );

        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "Member updated successfully.",
            "member_id" => $id
        ]);
    }

    // DELETE: Remove a member
    elseif ($method === "DELETE") {

        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$id || $id < 1) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "A valid member ID is required in the URL."
            ]);
            exit;
        }

        $sql = "DELETE FROM members WHERE member_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Member not found."
            ]);
        } else {
            echo json_encode([
                "success" => true,
                "message" => "Member deleted successfully.",
                "member_id" => $id
            ]);
        }

        $stmt->close();
    }

    // Reject unsupported methods
    else {
        header("Allow: GET, POST, PUT, DELETE");
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "message" => "Method not allowed."
        ]);
    }

} catch (mysqli_sql_exception $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "A database error occurred."
    ]);
}
?>
