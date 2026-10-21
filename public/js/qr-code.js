const status = document.getElementById("checkin-status");
const resultBox = document.getElementById("member-result");

async function checkInMember() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        status.textContent = "Check-in unavailable";
        resultBox.textContent = "No member QR token was provided.";
        resultBox.className = "error";
        return;
    }

    try {
        const response = await fetch("/api/checkin.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        status.textContent = data.success
            ? "Check-in complete"
            : "Check-in unsuccessful";

        resultBox.textContent = data.message ||
            "The server did not return a result.";

        resultBox.className = data.success ? "success" : "error";

    } catch (error) {
        status.textContent = "Connection problem";
        resultBox.textContent =
            "Unable to reach GymTrack. Please try again.";
        resultBox.className = "error";
        console.error(error);
    }
}

checkInMember();
