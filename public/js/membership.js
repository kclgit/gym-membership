document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("membershipModal");
    const form = document.getElementById("membershipForm");
    const planInput = document.getElementById("membership_type");
    const planDisplay = document.getElementById("membership_plan_display");

    const planDetails = {
    Promo: "Promo — ₱1,500/Month",
    Regular: "Regular — ₱1,750/Month",
    Premium: "Premium — ₱2,500/Month"
    };
    
    const startDate = document.getElementById("starting_date");
    const expirationDate = document.getElementById("expiration_date");
    const message = document.getElementById("formMessage");
    const submitButton = document.getElementById("submitMembership");

    const allowedPlans = ["Promo", "Regular", "Premium"];

    function localDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // Add one calendar month, handling dates like January 31.
    function addOneMonth(dateString) {
        if (!dateString) return "";

        const [year, month, day] = dateString.split("-").map(Number);

        const nextMonthDate = new Date(year, month, 1);
        const lastDay = new Date(
            nextMonthDate.getFullYear(),
            nextMonthDate.getMonth() + 1,
            0
        ).getDate();

        return localDateString(
            new Date(
                nextMonthDate.getFullYear(),
                nextMonthDate.getMonth(),
                Math.min(day, lastDay)
            )
        );
    }

    const today = localDateString(new Date());

    startDate.min = today;
    startDate.value = today;
    expirationDate.value = addOneMonth(today);

    // Select the plan based on the button clicked.
    document.querySelectorAll(".avail-btn").forEach(button => {
        button.addEventListener("click", () => {
            const selectedPlan = button.dataset.plan;

            if (!allowedPlans.includes(selectedPlan)) {
                message.textContent = "Invalid membership plan.";
                return;
            }

            // Automatically save the clicked plan in the hidden input.
            planInput.value = selectedPlan;
            planDisplay.value = planDetails[selectedPlan];

            message.textContent = "";
            modal.hidden = false;

            startDate.min = today;
            startDate.value = today;
            expirationDate.value = addOneMonth(today);

            document.getElementById("full_name").focus();
        });
    });

    // Update expiration date when the start date changes.
    startDate.addEventListener("change", () => {
        expirationDate.value = addOneMonth(startDate.value);
    });

    // Close the registration modal.
    document.getElementById("closeModal").addEventListener("click", () => {
        modal.hidden = true;
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.hidden = true;
        }
    });

    // Submit membership registration.
    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.textContent = "";

        if (!form.reportValidity()) return;

        if (!allowedPlans.includes(planInput.value)) {
            message.textContent = "Please select a membership plan.";
            return;
        }

        if (startDate.value < today) {
            message.textContent =
                "The start date cannot be in the past.";
            return;
        }

        expirationDate.value = addOneMonth(startDate.value);

        const data = Object.fromEntries(
            new FormData(form).entries()
        );

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const response = await fetch(
                "/312-mulong-midtermproject-1/backend/create_membership.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            );

            const responseText = await response.text();

            let result;

            try {
                result = JSON.parse(responseText);
            } catch {
                console.error("Server response:", responseText);
                throw new Error(
                    "The server returned an invalid response. " +
                    "Check the PHP error log."
                );
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Could not save membership."
                );
            }

            // Show only the success message.
            message.textContent =
                "Membership registered successfully.";

            form.reset();
        planDisplay.value = "";

            // Restore date fields after resetting the form.
            startDate.min = today;
            startDate.value = today;
            expirationDate.value = addOneMonth(today);

            // Clear the plan until another plan button is clicked.
            planInput.value = "";

            setTimeout(() => {
                modal.hidden = true;
                message.textContent = "";
            }, 2500);

        } catch (error) {
            console.error("Membership registration error:", error);

            message.textContent = error.message ||
                "An error occurred while saving the membership.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Register Membership";
        }
    });
});
