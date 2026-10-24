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


        #pending-count {
            padding: 10px;
            background: #fff7ed;
            color: #9a3412;
            border-radius: 8px;
            font-size: 14px;
        }


        .manual-entry {
            margin: 24px auto;
            padding: 20px;
            max-width: 500px;
            box-sizing: border-box;
            background: #f5f5f5;
            color: #222;
            border-radius: 12px;
        }

        .manual-entry h3 {
            margin-top: 0;
        }

        .manual-entry p {
            font-size: 14px;
            color: #555;
        }

        #manual-checkin-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        #manual-qr-token {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 14px;
        }

        #manual-checkin-button {
            background: #02579B;
            color: white;
            font-weight: bold;
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>GymTrack QR Check-in</h1>
    <p>Scan a member QR code or enter the token manually.</p>

    <button id="startButton" type="button">Start Camera</button>
    <button id="stopButton" type="button">Stop Camera</button>

    <div id="reader"></div>

    <div id="result" role="status" aria-live="polite">
        Choose a check-in method.
    </div>

    <p id="pending-count" aria-live="polite">
        Pending offline check-ins: 0
    </p>

    <div class="manual-entry">
        <h3>Manual Check-In</h3>
        <p>Use this option when a camera is unavailable.</p>

        <form id="manual-checkin-form">
            <input
                type="text"
                id="manual-qr-token"
                placeholder="Enter member QR token"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                required
            >

            <button type="submit" id="manual-checkin-button">
                Check In
            </button>
        </form>
    </div>
</div>

<script src="https://unpkg.com/html5-qrcode"></script>

<script>
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const result = document.getElementById("result");

    const manualForm = document.getElementById("manual-checkin-form");
    const manualTokenInput = document.getElementById("manual-qr-token");
    const manualCheckinButton =
        document.getElementById("manual-checkin-button");

    let scanner = null;
    let processing = false;


const CHECKIN_DB_NAME = "GymTrackCheckinOffline";
const CHECKIN_STORE_NAME = "checkinRequests";
const pendingCountElement = document.getElementById("pending-count");

let syncingCheckins = false;

function openCheckinDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CHECKIN_DB_NAME, 1);

        request.onupgradeneeded = function () {
            const db = request.result;

            if (!db.objectStoreNames.contains(CHECKIN_STORE_NAME)) {
                db.createObjectStore(CHECKIN_STORE_NAME, {
                    keyPath: "request_id"
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function savePendingCheckin(requestId, token) {
    const db = await openCheckinDB();

    try {
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(
                CHECKIN_STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(CHECKIN_STORE_NAME).put({
                request_id: requestId,
                qr_token: token,
                created_at: new Date().toISOString(),
                status: "pending"
            });

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        db.close();
    }

    await updatePendingCount();
}

async function getQueuedCheckins() {
    const db = await openCheckinDB();

    try {
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(
                CHECKIN_STORE_NAME,
                "readonly"
            );

            const request = transaction
                .objectStore(CHECKIN_STORE_NAME)
                .getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
}

async function updateQueuedCheckin(record) {
    const db = await openCheckinDB();

    try {
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(
                CHECKIN_STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(CHECKIN_STORE_NAME).put(record);

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        db.close();
    }

    await updatePendingCount();
}

async function removeQueuedCheckin(requestId) {
    const db = await openCheckinDB();

    try {
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(
                CHECKIN_STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(CHECKIN_STORE_NAME).delete(requestId);

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        db.close();
    }

    await updatePendingCount();
}


async function updatePendingCount() {
    try {
        const records = await getQueuedCheckins();

        const pending = records.filter(
            record => record.status === "pending"
        ).length;

        const rejected = records.filter(
            record => record.status === "rejected"
        ).length;

        pendingCountElement.textContent =
            "Pending offline check-ins: " + pending +
            (rejected > 0
                ? " | Rejected, needs attention: " + rejected
                : "");

    } catch (error) {
        console.error("Could not read pending check-ins:", error);

        pendingCountElement.textContent =
            "Pending check-ins: count unavailable";
    }
}

async function syncPendingCheckins() {
    if (!navigator.onLine || syncingCheckins) return;

    syncingCheckins = true;

    try {
        const records = await getQueuedCheckins();

        for (const record of records) {
            if (record.status !== "pending") continue;

            if (!navigator.onLine) break;

            try {
                const response = await fetch("qr_checkin_api.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        qr_token: record.qr_token,
                        request_id: record.request_id
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    await removeQueuedCheckin(record.request_id);
                    console.log(
                        "Offline check-in synchronized:",
                        record.request_id
                    );
                } else if (response.status >= 400 && response.status < 500) {
                    // Keep a record of rejected requests for troubleshooting.
                    await updateQueuedCheckin({
                        ...record,
                        status: "rejected",
                        error: data.message || "Server rejected the check-in."
                    });

                    console.warn(
                        "Check-in needs attention:",
                        data.message
                    );
                } else {
                    // A server error may be temporary. Retry on a later attempt.
                    break;
                }
            } catch (error) {
                // The server may be unreachable. Keep this record queued.
                console.warn("Check-in sync will retry later:", error);
                break;
            }
        }
    } catch (error) {
        console.error("Could not synchronize check-ins:", error);
    } finally {
        syncingCheckins = false;
        await updatePendingCount();
    }
}

window.addEventListener("online", syncPendingCheckins);
window.addEventListener("pageshow", syncPendingCheckins);

updatePendingCount();


    function showResult(message, success) {
        result.textContent = message;
        result.className = success ? "success" : "error";
    }

    
function createRequestId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (character) {
            const random = Math.random() * 16 | 0;
            const value = character === "x"
                ? random
                : (random & 0x3 | 0x8);

            return value.toString(16);
        }
    );
}

async function handleScan(decodedText) {
    if (processing) return;

    const token = decodedText.trim();

    if (!/^[a-f0-9]{64}$/i.test(token)) {
        showResult(
            "This is not a valid GymTrack member QR code.",
            false
        );
        return;
    }

    processing = true;
    manualCheckinButton.disabled = true;

    const requestId = createRequestId();

    try {
        if (!navigator.onLine) {
            await savePendingCheckin(requestId, token);

            showResult(
                "Check-in saved on this device. Pending verification until the server reconnects.",
                false
            );
            return;
        }

        let response;
        let data;

        try {
            response = await fetch("qr_checkin_api.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    qr_token: token,
                    request_id: requestId
                })
            });

            data = await response.json();
        } catch (error) {
            // Network failure or unreadable server response.
            // The server may already have recorded the check-in.
            await savePendingCheckin(requestId, token);

            showResult(
                "Server response unavailable. Check-in saved locally and will be verified during synchronization.",
                false
            );
            return;
        }

        if (response.ok && data.success) {
            showResult(
                "Check-in confirmed! Welcome, " +
                data.member_name +
                ". Time: " + data.time_in,
                true
            );

            manualTokenInput.value = "";

            // Refresh the queue count and retry any older requests.
            await updatePendingCount();
            syncPendingCheckins();
            return;
        }

        if (response.status >= 500) {
            // Temporary server error: retain the same request ID.
            await savePendingCheckin(requestId, token);

            showResult(
                "Server error. Check-in saved locally and will be retried.",
                false
            );
            return;
        }

        // A 4xx response indicates a rejected request.
        // Do not queue invalid tokens or expired memberships.
        showResult(
            data.message || "Check-in failed.",
            false
        );

    } catch (error) {
        console.error("Check-in processing error:", error);

        showResult(
            "Could not complete the check-in. Please try again.",
            false
        );
    } finally {
        processing = false;
        manualCheckinButton.disabled = false;
    }
}

    manualForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const token = manualTokenInput.value.trim();

        if (!token) {
            showResult("Please enter a member QR token.", false);
            return;
        }

        await handleScan(token);
    });

    startButton.addEventListener("click", async function () {
        if (scanner) return;

        if (typeof Html5Qrcode === "undefined") {
            showResult(
                "The scanner library could not load. You can still use manual entry.",
                false
            );
            return;
        }

        try {
            scanner = new Html5Qrcode("reader");

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                handleScan,
                function () {}
            );

            showResult("Camera started. Point it at a member QR code.", true);

        } catch (error) {
            if (scanner) {
                try {
                    await scanner.clear();
                } catch (clearError) {
                    console.error(clearError);
                }
            }

            scanner = null;

            showResult(
                "Camera unavailable. You can use Manual Check-In instead.",
                false
            );
        }
    });

    stopButton.addEventListener("click", async function () {
        if (!scanner) {
            showResult("Camera is not running. Manual entry is available.", true);
            return;
        }

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }

            await scanner.clear();
        } catch (error) {
            console.error(error);
        }

        scanner = null;
        showResult("Camera stopped. Manual entry is still available.", true);
    });
</script>

</body>
</html>
