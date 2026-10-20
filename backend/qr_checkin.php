<?php
require_once "db.php";
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GymTrack QR Check-in</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 20px;
        }

        .container {
            max-width: 500px;
            margin: 30px auto;
            background: white;
            padding: 24px;
            border-radius: 14px;
            box-shadow: 0 4px 15px #00000012;
        }

        h1, p {
            text-align: center;
        }

        #reader {
            width: 100%;
            margin-top: 20px;
        }

        button {
            padding: 12px 16px;
            border: 0;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px 0;
            width: 100%;
            font-size: 16px;
        }

        #startButton {
            background: #166534;
            color: white;
        }

        #stopButton {
            background: #e5e7eb;
            color: #111827;
        }

        #result {
            padding: 14px;
            border-radius: 8px;
            margin-top: 16px;
            overflow-wrap: anywhere;
            text-align: center;
        }

        .success {
            background: #dcfce7;
            color: #166534;
        }

        .error {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>GymTrack QR Check-in</h1>
    <p>Scan your member QR code to record your check-in.</p>

    <button id="startButton">Start Camera</button>
    <button id="stopButton">Stop Camera</button>

    <div id="reader"></div>
    <div id="result" role="status" aria-live="polite">
        Press Start Camera to begin.
    </div>
</div>

<!-- QR scanner library -->
<script src="https://unpkg.com/html5-qrcode"></script>

<script>
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const result = document.getElementById("result");

    let scanner = null;
    let processing = false;

    function showResult(message, success) {
        result.textContent = message;
        result.className = success ? "success" : "error";
    }

    async function handleScan(decodedText) {
        if (processing) return;

        // The QR code should contain the 64-character token.
        if (!/^[a-f0-9]{64}$/i.test(decodedText)) {
            showResult("This is not a valid GymTrack member QR code.", false);
            return;
        }

        processing = true;

        try {
            const response = await fetch("qr_checkin_api.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    qr_token: decodedText
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showResult(data.message || "Check-in failed.", false);
                return;
            }

            showResult(
                "Check-in successful! Welcome, " +
                data.member_name +
                ". Time: " + data.time_in,
                true
            );

        } catch (error) {
            showResult(
                "Could not contact the server. Check your connection.",
                false
            );
        } finally {
            // Prevent repeated scans briefly.
            setTimeout(() => {
                processing = false;
            }, 2500);
        }
    }

    startButton.addEventListener("click", async () => {
        if (scanner) return;

        try {
            scanner = new Html5Qrcode("reader");

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                handleScan,
                () => {}
            );

            showResult("Camera started. Point it at a member QR code.", true);

        } catch (error) {
            scanner = null;
            showResult(
                "Could not start the camera. Allow camera access and use HTTPS or localhost.",
                false
            );
        }
    });

    stopButton.addEventListener("click", async () => {
        if (!scanner) return;

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }

            await scanner.clear();
        } catch (error) {
            console.error(error);
        }

        scanner = null;
        showResult("Camera stopped.", true);
    });
</script>

</body>
</html>
