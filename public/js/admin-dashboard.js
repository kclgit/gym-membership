
document.addEventListener("DOMContentLoaded", () => {
    const reportsBody = document.getElementById("reports-body");
    const dashboardStatus = document.getElementById("dashboard-status");
    const refreshButton = document.getElementById("refresh-button");

    const totalJS = document.getElementById("total-js");
    const totalDB = document.getElementById("total-db");
    const clientTotal = document.getElementById("client-total");

    const REPORTS_URL = "../backend/get_membership_queue_reports.php";
    const STALE_AFTER_MS = 5 * 60 * 1000;

    function addCell(row, value, className = "") {
        const cell = document.createElement("td");
        cell.textContent = value;

        if (className) {
            cell.className = className;
        }

        row.appendChild(cell);
        return cell;
    }

    function parseReportDate(value) {
        if (!value) return null;

        // Interpret MySQL DATETIME/TIMESTAMP in the browser's local timezone.
        const date = new Date(String(value).replace(" ", "T"));

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = parseReportDate(value);

        if (!date) return "Unknown";

        return date.toLocaleString();
    }

    function getReportStatus(value) {
        const date = parseReportDate(value);

        if (!date) {
            return {
                label: "Unknown",
                className: "status-unknown"
            };
        }

        if (Date.now() - date.getTime() > STALE_AFTER_MS) {
            return {
                label: "Stale",
                className: "status-stale"
            };
        }

        return {
            label: "Recent",
            className: "status-fresh"
        };
    }

    function displayCount(value) {
        return Number.isInteger(value) && value >= 0
            ? String(value)
            : "Unavailable";
    }

    function displayClientName(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "Unnamed Client";
        }

        return value.trim();
    }

    async function loadReports() {
        refreshButton.disabled = true;
        dashboardStatus.textContent = "Loading reports...";

        try {
            const response = await fetch(REPORTS_URL, {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const rawResponse = await response.text();

            // Keep these logs to help diagnose PHP endpoint errors.
            console.log("Reports endpoint URL:", response.url);
            console.log("HTTP status:", response.status);
            console.log(
                "Content-Type:",
                response.headers.get("content-type")
            );

            let result;

            try {
                result = JSON.parse(rawResponse);
            } catch {
                console.error("Raw server response:", rawResponse);

                throw new Error(
                    "Server response is not JSON. Check the PHP endpoint."
                );
            }

            if (
                !response.ok ||
                result.success !== true ||
                !Array.isArray(result.reports)
            ) {
                throw new Error(
                    result.message || "Could not load queue reports."
                );
            }

            const reports = result.reports;

            let knownJS = 0;
            let knownDB = 0;
            let unknownJS = false;
            let unknownDB = false;

            reportsBody.replaceChildren();

            if (reports.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 5;
                cell.textContent =
                    "No client reports yet. Open a client membership page while online.";

                row.appendChild(cell);
                reportsBody.appendChild(row);
            }

            for (const report of reports) {
                const row = document.createElement("tr");

                // Display the friendly name instead of the UUID.
                const clientCell = document.createElement("td");
                clientCell.className = "client-cell";

                const nameElement = document.createElement("span");
                nameElement.className = "client-name";
                nameElement.textContent = displayClientName(
                    report.client_name
                );

                clientCell.appendChild(nameElement);

                // Show the full client ID beneath the name for troubleshooting.
                if (report.client_id) {
                    const idElement = document.createElement("small");
                    idElement.className = "client-id";
                    idElement.textContent = String(report.client_id);

                    clientCell.appendChild(idElement);
                }

                row.appendChild(clientCell);

                addCell(
                    row,
                    displayCount(report.pending_memberships_js),
                    "queue-count"
                );

                addCell(
                    row,
                    displayCount(report.pending_memberships_db),
                    "queue-count"
                );

                addCell(row, formatDate(report.last_reported_at));

                const status = getReportStatus(
                    report.last_reported_at
                );

                addCell(row, status.label, status.className);

                reportsBody.appendChild(row);

                if (
                    Number.isInteger(report.pending_memberships_js) &&
                    report.pending_memberships_js >= 0
                ) {
                    knownJS += report.pending_memberships_js;
                } else {
                    unknownJS = true;
                }

                if (
                    Number.isInteger(report.pending_memberships_db) &&
                    report.pending_memberships_db >= 0
                ) {
                    knownDB += report.pending_memberships_db;
                } else {
                    unknownDB = true;
                }
            }

            totalJS.textContent = unknownJS
                ? `${knownJS} + unknown`
                : String(knownJS);

            totalDB.textContent = unknownDB
                ? `${knownDB} + unknown`
                : String(knownDB);

            clientTotal.textContent = String(reports.length);

            dashboardStatus.textContent =
                `Loaded ${reports.length} client report(s). ` +
                `Last dashboard refresh: ${new Date().toLocaleTimeString()}.`;
        } catch (error) {
            console.error("Dashboard report loading failed:", error);

            dashboardStatus.textContent =
                "Unable to load reports. Check the PHP endpoint and database connection.";
        } finally {
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener("click", loadReports);

    loadReports();
    window.setInterval(loadReports, 30000);
});
