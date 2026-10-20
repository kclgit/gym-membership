
<?php
require_once "db.php";

header("Content-Type: text/html; charset=UTF-8");

$sql = "
    SELECT member_id, name, qr_token
    FROM members
    WHERE qr_token IS NOT NULL AND qr_token != ''
    ORDER BY name ASC
";

$result = $conn->query($sql);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GymTrack Member QR Codes</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f4f4f4;
        }

        h1 {
            text-align: center;
        }

        .members {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 20px;
        }

        .member-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 8px #00000015;
        }

        .member-card img {
            width: 180px;
            height: 180px;
        }

        .member-card button {
            padding: 8px 12px;
            cursor: pointer;
        }

        @media print {
            body {
                background: white;
            }

            .member-card {
                box-shadow: none;
                border: 1px solid #ccc;
                break-inside: avoid;
            }

            .member-card button {
                display: none;
            }
        }
    </style>
</head>
<body>

<h1>GymTrack Member QR Codes</h1>

<div class="members">
    <?php while ($member = $result->fetch_assoc()): ?>
        <div class="member-card">
            <h2>
                <?= htmlspecialchars($member["name"], ENT_QUOTES, "UTF-8") ?>
            </h2>

            <p>
                Member ID:
                <?= (int) $member["member_id"] ?>
            </p>

            <img
                alt="QR code for <?= htmlspecialchars($member["name"], ENT_QUOTES, "UTF-8") ?>"
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&amp;data=<?= urlencode($member["qr_token"]) ?>"
            >

            <p>GymTrack Member QR Code</p>
        </div>
    <?php endwhile; ?>
</div>

<p style="text-align:center; margin-top:20px;">
    <button onclick="window.print()">Print QR Codes</button>
</p>

</body>
</html>
