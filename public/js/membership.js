document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("membershipModal");
    const form = document.getElementById("membershipForm");
    const planInput = document.getElementById("membership_type");
    const planDisplay = document.getElementById("membership_plan_display");
    const startDate = document.getElementById("starting_date");
    const expirationDate = document.getElementById("expiration_date");
    const message = document.getElementById("formMessage");
    const submitButton = document.getElementById("submitMembership");
    const closeButton = document.getElementById("closeModal");

    if (!modal || !form || !planInput || !planDisplay || !startDate ||
        !expirationDate || !message || !submitButton || !closeButton) {
        return;
    }

    const planDetails = {
        Promo: "Promo — ₱1,500/Month",
        Regular: "Regular — ₱1,750/Month",
        Premium: "Premium — ₱2,500/Month"
    };

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
    let lastFocused = null;

    function resetDates() {
        startDate.min = today;
        startDate.value = today;
        expirationDate.value = addOneMonth(today);
    }

    function openModal(plan) {
        planInput.value = plan;
        planDisplay.value = planDetails[plan];
        message.textContent = "";

        resetDates();
        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.classList.add("modal-open");

        const nameField = document.getElementById("full_name");
        if (nameField) nameField.focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");

        if (lastFocused) {
            lastFocused.focus();
            lastFocused = null;
        }
    }

    resetDates();

    // Select the plan based on the button clicked.
    document.querySelectorAll(".avail-btn").forEach(button => {
        button.addEventListener("click", () => {
            const selectedPlan = button.dataset.plan;

            if (!allowedPlans.includes(selectedPlan)) {
                message.textContent = "Invalid membership plan.";
                return;
            }

            openModal(selectedPlan);
        });
    });

    // Update expiration date when the start date changes.
    startDate.addEventListener("change", () => {
        expirationDate.value = addOneMonth(startDate.value);
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) closeModal();
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
            message.textContent = "The start date cannot be in the past.";
            return;
        }

        expirationDate.value = addOneMonth(startDate.value);

        const data = Object.fromEntries(
            new FormData(form).entries()
        );

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const result = await api.post("create_membership.php", data);

            message.textContent =
                result.message || "Membership registered successfully.";

            form.reset();
            planDisplay.value = "";
            planInput.value = "";
            resetDates();

            if (typeof showToast === "function") {
                showToast("Membership registered");
            }

            setTimeout(() => {
                closeModal();
                message.textContent = "";
            }, 2500);

        } catch (error) {
            console.error("Membership registration error:", error);

            message.textContent = error.message ||
                "An error occurred while saving the membership.";

            if (typeof showToast === "function") {
                showToast(error.message || "Could not save membership.", "error");
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Register Membership";
        }
    });
});
