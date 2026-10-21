
<?php
require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER["REQUEST_METHOD"];

try {

    // READ: Get all exercises
    if ($method === "GET") {

        $sql = "SELECT exercise_id, exercise_name, muscle_group
                FROM exercises
                ORDER BY exercise_name ASC";

        $result = $conn->query($sql);
        $exercises = [];

        while ($row = $result->fetch_assoc()) {
            $exercises[] = $row;
        }

        echo json_encode([
            "success" => true,
            "data" => $exercises
        ]);
    }

    // CREATE: Add an exercise
    elseif ($method === "POST") {

        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON input."
            ]);
            exit;
        }

        $exercise_name = trim($input["exercise_name"] ?? "");
        $muscle_group = trim($input["muscle_group"] ?? "");

        if ($exercise_name === "" || $muscle_group === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Exercise name and muscle group are required."
            ]);
            exit;
        }

        if (strlen($exercise_name) > 100 ||
            strlen($muscle_group) > 50) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Input exceeds the allowed length."
            ]);
            exit;
        }

        $sql = "INSERT INTO exercises (exercise_name, muscle_group)
                VALUES (?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $exercise_name, $muscle_group);
        $stmt->execute();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Exercise added successfully.",
            "exercise_id" => $conn->insert_id
        ]);

        $stmt->close();
    }

    // UPDATE: Edit an existing exercise
    elseif ($method === "PUT") {

        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$id || $id < 1) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "A valid exercise ID is required in the URL."
            ]);
            exit;
        }

        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON input."
            ]);
            exit;
        }

        $exercise_name = trim($input["exercise_name"] ?? "");
        $muscle_group = trim($input["muscle_group"] ?? "");

        if ($exercise_name === "" || $muscle_group === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Exercise name and muscle group are required."
            ]);
            exit;
        }

        if (strlen($exercise_name) > 100 ||
            strlen($muscle_group) > 50) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Input exceeds the allowed length."
            ]);
            exit;
        }

        // Check whether the exercise exists
        $check = $conn->prepare(
            "SELECT exercise_id FROM exercises WHERE exercise_id = ?"
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
                "message" => "Exercise not found."
            ]);
            exit;
        }

        // Update the exercise
        $sql = "UPDATE exercises
                SET exercise_name = ?, muscle_group = ?
                WHERE exercise_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssi",
            $exercise_name,
            $muscle_group,
            $id
        );
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "Exercise updated successfully.",
            "exercise_id" => $id
        ]);
    }

    // DELETE: Remove an exercise
    elseif ($method === "DELETE") {

        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$id || $id < 1) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "A valid exercise ID is required in the URL."
            ]);
            exit;
        }

        $sql = "DELETE FROM exercises WHERE exercise_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Exercise not found."
            ]);
        } else {
            echo json_encode([
                "success" => true,
                "message" => "Exercise deleted successfully.",
                "exercise_id" => $id
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
