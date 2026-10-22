const statusText = document.getElementById("connection-status");
        const retryButton = document.getElementById("retry-button");

        function updateConnectionStatus() {
            statusText.textContent = navigator.onLine
                ? "You appear to be online. Try opening the page again."
                : "You are currently offline. Please check your connection.";
        }

        retryButton.addEventListener("click", () => {
            if (navigator.onLine) {
                window.location.href = "index.html";
            } else {
                statusText.textContent =
                    "Still offline. Please check your connection and try again.";
            }
        });

        window.addEventListener("online", updateConnectionStatus);
        window.addEventListener("offline", updateConnectionStatus);

        updateConnectionStatus();