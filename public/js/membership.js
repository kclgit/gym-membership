
"use strict";

// ========================================
// GYМTRACK MEMBERSHIP TRANSACTION
// ========================================

// Membership buttons
const availButtons = document.querySelectorAll(".avail-now");

// Pop-up elements
const modal = document.getElementById("membership-modal");
const closeButton = document.getElementById("close-membership-modal");
const cancelButton = document.getElementById("cancel-membership");

// Form elements
const membershipForm = document.getElementById("membership-form");
const planName = document.getElementById("selected-plan-name");
const planPrice = document.getElementById("selected-plan-price");
const planInput = document.getElementById("membership-plan");
const priceInput = document.getElementById("membership-price");
const startDateInput = document.getElementById("member-start-date");
const message = document.getElementById("membership-form-message");

const STORAGE_KEY = "gymtrack.pendingMembershipRequests";

// ========================================
// OPEN POP-UP AND SELECT MEMBERSHIP
// ========================================

availButtons.forEach((button) => {
    button.addEventListener("click", () => {
        // Read data from the button that was clicked
        const selectedPlan = button.dataset.plan;
        const selectedPrice = Number(button.dataset.price);

        // Check whether the button contains valid information
        if (
            !selectedPlan ||
            !Number.isFinite(selectedPrice) ||
            selectedPrice <= 0
        ) {
            showMessage("Invalid membership plan. Please try again.", true);
            return;
        }

        // Display the correct plan and price
        planName.textContent = selectedPlan;
        planPrice.textContent =
            `₱${selectedPrice.toLocaleString("en-PH")}/month`;

        // Store the selected values in the form
        planInput.value = selectedPlan;
        priceInput.value = String(selectedPrice);

        // Clear previous messages and form data
        membershipForm.reset();
        planInput.value = selectedPlan;
        priceInput.value = String(selectedPrice);
        message.textContent = "";
        message.className = "form-message";

        // Set the earliest allowed start date to today
        const today = new Date();
        const localToday = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        startDateInput.min = localToday;

        // Open the pop-up
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");

        // Focus the first field
        document.getElementById("member-name").focus();
    });
});

// ========================================
// CLOSE POP-UP
// ========================================

function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    message.textContent = "";
}

closeButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);

// Close when clicking outside the dialog
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Close using the Escape key
document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        modal.classList.contains("is-open")
    ) {
        closeModal();
    }
});

// ========================================
// DISPLAY FORM MESSAGES
// ========================================

function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError
        ? "form-message error"
        : "form-message success";
}

// ========================================
// SAVE MEMBERSHIP REQUEST
// ========================================

membershipForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Validate all required fields
    if (!membershipForm.checkValidity()) {
        membershipForm.reportValidity();
        return;
    }

    // Read the selected membership
    const selectedPlan = planInput.value;
    const selectedPrice = Number(priceInput.value);

    // Validate the selected plan against known prices
    const validPlans = {
        Promo: 1500,
        Regular: 1750,
        Premium: 2500
    };

    if (
        !Object.prototype.hasOwnProperty.call(
            validPlans,
            selectedPlan
        ) ||
        validPlans[selectedPlan] !== selectedPrice
    ) {
        showMessage(
            "Invalid membership selection. Please select a plan again.",
            true
        );
        return;
    }

    // Collect the customer's information
    const request = {
        id: crypto.randomUUID(),
        fullName: document.getElementById("member-name").value.trim(),
        email: document.getElementById("member-email").value.trim(),
        phone: document.getElementById("member-phone").value.trim(),
        plan: selectedPlan,
        price: selectedPrice,
        startDate: startDateInput.value,
        status: "pending",
        syncStatus: "pending",
        createdAt: new Date().toISOString()
    };

    // Validate that the name is not empty after trimming
    if (!request.fullName) {
        showMessage("Please enter your full name.", true);
        return;
    }

    // Load existing requests from localStorage
    let requests = [];

    try {
        const savedRequests = localStorage.getItem(STORAGE_KEY);
        requests = savedRequests ? JSON.parse(savedRequests) : [];

        if (!Array.isArray(requests)) {
            throw new Error("Invalid saved membership data.");
        }

        // Save the new request
        requests.push(request);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(requests)
        );
    } catch (error) {
        console.error("Unable to save membership request:", error);

        showMessage(
            "Unable to save your request on this device. Please check browser storage.",
            true
        );
        return;
    }

    // Show successful submission
    showMessage(
        `Membership request submitted! Plan: ${request.plan}. ` +
        `Price: ₱${request.price.toLocaleString("en-PH")}/month.`
    );

    console.log("Membership request saved:", request);

    // Close the pop-up after a short delay
    window.setTimeout(() => {
        closeModal();
        membershipForm.reset();
    }, 1800);
});
