document.addEventListener("DOMContentLoaded", function () {

    // Get the chart elements
    const chartSelect = document.querySelector(".chart-select");
    const chartGroups = document.querySelectorAll(".chart-bar-group");

    // Sample data for demonstration only
    const chartData = {
        "Last 30 Days": {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Now"],
            heights: [40, 45, 55, 65, 85]
        },

        "Last 3 Months": {
            labels: ["Month 1", "Month 2", "Month 3", "Month 4", "Now"],
            heights: [35, 50, 45, 70, 85]
        },

        "Last Year": {
            labels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec", "Now"],
            heights: [30, 45, 60, 55, 85]
        }
    };

    // Update the chart when the selected period changes
    function updateChart() {
        const selectedPeriod = chartSelect.value;
        const data = chartData[selectedPeriod];

        if (!data) {
            return;
        }

        chartGroups.forEach(function (group, index) {
            const bar = group.querySelector(".chart-bar");
            const label = group.querySelector(".chart-label");

            // Update the bar height
            bar.style.height = data.heights[index] + "%";

            // Update the label
            label.textContent = data.labels[index];

            // Highlight the latest entry
            bar.classList.toggle(
                "active",
                index === chartGroups.length - 1
            );

            label.classList.toggle(
                "active",
                index === chartGroups.length - 1
            );
        });
    }

    // Listen for changes to the time-range dropdown
    chartSelect.addEventListener("change", updateChart);

    // Make the View all link open the Workouts page
    const viewAllLink = document.querySelector(".view-all");

    if (viewAllLink) {
        viewAllLink.href = "workout.html";
    }

});
