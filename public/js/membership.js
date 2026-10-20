document.addEventListener("DOMContentLoaded", function () {
    // Get all membership plan boxes
    const membershipBoxes = document.querySelectorAll("#main-membership .box");

    membershipBoxes.forEach(function (box) {
        // Get the plan name and price
        const planName = box.querySelector(".title").textContent.trim();
        const planPrice = box.querySelector(".price").textContent.trim();

        // Get the Avail Now element
        const availButton = box.querySelector(".button");

        // Make it behave like a clickable button
        availButton.style.cursor = "pointer";
        availButton.setAttribute("role", "button");
        availButton.setAttribute("tabindex", "0");

        // Handle clicking Avail Now
        function selectPlan() {
            const confirmed = window.confirm(
                "You selected the " + planName +
                " membership (" + planPrice + ").\n\n" +
                "Would you like to continue?"
            );

            if (confirmed) {
                // Keep the selected plan available for the next step
                sessionStorage.setItem(
                    "selectedMembership",
                    JSON.stringify({
                        name: planName,
                        price: planPrice
                    })
                );

                alert(
                    "You selected the " + planName +
                    " plan.\n\nThe next step is to connect this selection " +
                    "to a membership form and the database."
                );
            }
        }

        availButton.addEventListener("click", selectPlan);

        // Allow keyboard users to activate the selection
        availButton.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectPlan();
            }
        });
    });
});
