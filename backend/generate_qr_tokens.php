<?php
require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

try {
    // Find members who do not have a QR token yet.
    $sql = "
        SELECT member_id
        FROM members
        WHERE qr_token IS NULL OR qr_token = ''
    ";

    $result = $conn->query($sql);

    // Prepare the update statement once.
    $update = $conn->prepare("
        UPDATE members
        SET qr_token = ?
        WHERE member_id = ?
          AND (qr_token IS NULL OR qr_token = '')
    ");

    $generated = 0;

    while ($member = $result->fetch_assoc()) {
        // Generate a secure, random 64-character token.
        $token = bin2hex(random_bytes(32));
        $memberId = (int) $member["member_id"];

        $update->bind_param("si", $token, $memberId);
        $update->execute();

        if ($update->affected_rows === 1) {
            $generated++;
        }
    }

    $update->close();

    echo json_encode([
        "success" => true,
        "message" => "QR tokens generated successfully.",
        "tokens_generated" => $generated
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Could not generate QR tokens."
    ]);
}
?>
