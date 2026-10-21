
<?php
require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER["REQUEST_METHOD"];

// Validate dates in YYYY-MM-DD format.
function isValidDate($date) {
    $dateObject = DateTime::createFromFormat("!Y-m-d", $date);

    return $dateObject !== false
        && $dateObject->format("Y-m-d") === $date;
}

// Validate times in HH:MM or HH:MM:SS format.
function isValidTime($time) {
    if (!is_string($time)) {
        return false;
    }

    $formats = ["!H:i", "!H:i:s"];

    foreach ($formats as $format) {
        $timeObject = DateTime::createFromFormat($format, $time);

        if (
            $timeObject !== false
            && $timeObject->format(
                str_contains($format, "s") ? "H:i:s" : "H:i"
            ) === $time
        ) {
            return true;
        }
    }

    return false;
}

// Check whether the member exists.
function memberExists($conn, $memberId) {
    $sql = "SELECT member_id FROM members WHERE member_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $memberId);
    $stmt->execute();

    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;

    $stmt->close();

    return $exists;
}

// Send a JSON error response.
function sendError($status, $message) {
    http_response_code($status);

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);

    exit;
}

try {
    // GET: Retrieve check-ins.
    if ($method === "GET") {
        if (isset($_GET["id"])) {
            $id = filter_var(
                $_GET["id"],
                FILTER_VALIDATE_INT,
                ["options" => ["min_range" => 1]]
            );

            if ($id === false) {
                sendError(400, "Invalid check-in ID.");
            }

            $sql = "
                SELECT c.*, m.name AS member_name
                FROM check_ins c
                JOIN members m ON c.member_id = m.member_id
                WHERE c.checkin_id = ?
            ";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $result = $stmt->get_result();
            $checkin = $result->fetch_assoc();

            $stmt->close();

            if (!$checkin) {
                sendError(404, "Check-in not found.");
            }

            echo json_encode([
                "success" => true,
                "data" => $checkin
            ]);
        } else {
            $sql = "
                SELECT c.*, m.name AS member_name
                FROM check_ins c
                JOIN members m ON c.member_id = m.member_id
                ORDER BY c.checkin_date DESC, c.time_in DESC
            ";

            $result = $conn->query($sql);
            $checkins = [];

            while ($row = $result->fetch_assoc()) {
                $checkins[] = $row;
            }

            echo json_encode([
                "success" => true,
                "data" => $checkins
            ]);
        }
    }

    // POST: Record a new check-in.
    elseif ($method === "POST") {
        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        if (!is_array($input)) {
            sendError(400, "Invalid JSON input.");
        }

        $memberId = filter_var(
            $input["member_id"] ?? null,
            FILTER_VALIDATE_INT,
            ["options" => ["min_range" => 1]]
        );

        $date = $input["checkin_date"] ?? "";
        $timeIn = $input["time_in"] ?? "";
        $timeOut = $input["time_out"] ?? null;

        if (
            $memberId === false
            || !is_string($date)
            || !is_string($timeIn)
            || ($timeOut !== null && !is_string($timeOut))
        ) {
            sendError(400, "Invalid check-in information.");
        }

        if (
            !isValidDate($date)
            || !isValidTime($timeIn)
            || ($timeOut !== null && !isValidTime($timeOut))
        ) {
            sendError(400, "Invalid date or time format.");
        }

        if ($timeOut !== null && $timeOut < $timeIn) {
            sendError(400, "Time out cannot be earlier than time in.");
        }

        if (!memberExists($conn, $memberId)) {
            sendError(404, "Member not found.");
        }

        $sql = "
            INSERT INTO check_ins
                (member_id, checkin_date, time_in, time_out)
            VALUES (?, ?, ?, ?)
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "isss",
            $memberId,
            $date,
            $timeIn,
            $timeOut
        );

        $stmt->execute();
        $newId = $conn->insert_id;
        $stmt->close();

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "Check-in recorded successfully.",
            "checkin_id" => $newId
        ]);
    }

    // PUT: Update an existing check-in.
    elseif ($method === "PUT") {
        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT,
            ["options" => ["min_range" => 1]]
        );

        if ($id === false) {
            sendError(400, "A valid check-in ID is required.");
        }

        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        if (!is_array($input)) {
            sendError(400, "Invalid JSON input.");
        }

        $memberId = filter_var(
            $input["member_id"] ?? null,
            FILTER_VALIDATE_INT,
            ["options" => ["min_range" => 1]]
        );

        $date = $input["checkin_date"] ?? "";
        $timeIn = $input["time_in"] ?? "";
        $timeOut = $input["time_out"] ?? null;

        if (
            $memberId === false
            || !is_string($date)
            || !is_string($timeIn)
            || ($timeOut !== null && !is_string($timeOut))
        ) {
            sendError(400, "Invalid check-in information.");
        }

        if (
            !isValidDate($date)
            || !isValidTime($timeIn)
            || ($timeOut !== null && !isValidTime($timeOut))
        ) {
            sendError(400, "Invalid date or time format.");
        }

        if ($timeOut !== null && $timeOut < $timeIn) {
            sendError(400, "Time out cannot be earlier than time in.");
        }

        if (!memberExists($conn, $memberId)) {
            sendError(404, "Member not found.");
        }

        $checkStmt = $conn->prepare(
            "SELECT checkin_id FROM check_ins WHERE checkin_id = ?"
        );
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();

        $exists = $checkStmt->get_result()->num_rows > 0;
        $checkStmt->close();

        if (!$exists) {
            sendError(404, "Check-in not found.");
        }

        $sql = "
            UPDATE check_ins
            SET member_id = ?,
                checkin_date = ?,
                time_in = ?,
                time_out = ?
            WHERE checkin_id = ?
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "isssi",
            $memberId,
            $date,
            $timeIn,
            $timeOut,
            $id
        );

        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "Check-in updated successfully.",
            "checkin_id" => $id
        ]);
    }

    // DELETE: Remove a check-in.
    elseif ($method === "DELETE") {
        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT,
            ["options" => ["min_range" => 1]]
        );

        if ($id === false) {
            sendError(400, "A valid check-in ID is required.");
        }

        $sql = "DELETE FROM check_ins WHERE checkin_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        $deleted = $stmt->affected_rows > 0;
        $stmt->close();

        if (!$deleted) {
            sendError(404, "Check-in not found.");
        }

        echo json_encode([
            "success" => true,
            "message" => "Check-in deleted successfully.",
            "checkin_id" => $id
        ]);
    }

    // Reject unsupported HTTP methods.
    else {
        header("Allow: GET, POST, PUT, DELETE");
        sendError(405, "Method not allowed.");
    }

} catch (mysqli_sql_exception $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "A database error occurred."
    ]);
}
?>
