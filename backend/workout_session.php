
<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/db.php";

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, [
        "success" => false,
        "message" => "Use POST for workout session actions."
    ]);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    respond(400, [
        "success" => false,
        "message" => "Invalid JSON request."
    ]);
}

$action = $input["action"] ?? "";

// Demo member created for GymTrack.
$memberId = 9;

if ($action === "start") {
    $workoutName = trim($input["workout_name"] ?? "");

    if ($workoutName === "") {
        respond(400, [
            "success" => false,
            "message" => "Workout name is required."
        ]);
    }

    $stmt = $conn->prepare(
        "INSERT INTO workout_sessions (member_id, workout_name)
         VALUES (?, ?)"
    );

    if (!$stmt) {
        respond(500, [
            "success" => false,
            "message" => "Could not prepare the session."
        ]);
    }

    $stmt->bind_param("is", $memberId, $workoutName);

    if (!$stmt->execute()) {
        $stmt->close();
        respond(500, [
            "success" => false,
            "message" => "Could not start the workout session."
        ]);
    }

    $sessionId = $stmt->insert_id;
    $stmt->close();

    respond(201, [
        "success" => true,
        "message" => "Workout started.",
        "session_id" => $sessionId,
        "member_id" => $memberId,
        "workout_name" => $workoutName
    ]);
}

if ($action === "finish") {
    $sessionId = filter_var(
        $input["session_id"] ?? null,
        FILTER_VALIDATE_INT
    );

    $duration = filter_var(
        $input["duration_seconds"] ?? null,
        FILTER_VALIDATE_INT
    );

    if (!$sessionId || $duration === false || $duration < 0) {
        respond(400, [
            "success" => false,
            "message" => "A valid session ID and duration are required."
        ]);
    }

    $stmt = $conn->prepare(
        "UPDATE workout_sessions
         SET finished_at = NOW(),
             duration_seconds = ?,
             status = 'completed'
         WHERE session_id = ?
           AND member_id = ?
           AND status = 'in_progress'"
    );

    if (!$stmt) {
        respond(500, [
            "success" => false,
            "message" => "Could not prepare the session update."
        ]);
    }

    $stmt->bind_param("iii", $duration, $sessionId, $memberId);

    if (!$stmt->execute()) {
        $stmt->close();
        respond(500, [
            "success" => false,
            "message" => "Could not finish the workout."
        ]);
    }

    $updated = $stmt->affected_rows;
    $stmt->close();

    if ($updated !== 1) {
        respond(409, [
            "success" => false,
            "message" => "Session not found or already finished."
        ]);
    }

    respond(200, [
        "success" => true,
        "message" => "Workout completed and saved.",
        "session_id" => $sessionId,
        "duration_seconds" => $duration
    ]);
}

respond(400, [
    "success" => false,
    "message" => "Unknown action. Use start or finish."
]);
