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

    if (
        !modal || !form || !planInput || !planDisplay ||
        !startDate || !expirationDate || !message ||
        !submitButton || !closeButton
    ) {
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
        startDate.min = localDateString(new Date());

        if (!startDate.value) {
            startDate.value = localDateString(new Date());
        }

        expirationDate.value = addOneMonth(startDate.value);
    }

    function openModal(plan) {
        if (!allowedPlans.includes(plan)) {
            message.textContent = "Invalid membership plan.";
            return;
        }

        planInput.value = plan;
        planDisplay.value = planDetails[plan];
        message.textContent = "";
        message.className = "";

        startDate.value = localDateString(new Date());
        resetDates();

        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.classList.add("modal-open");

        const nameField = document.getElementById("full_name");

        if (nameField) {
            nameField.focus();
        }
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");

        if (lastFocused) {
            lastFocused.focus();
            lastFocused = null;
        }
    }

    const DB_NAME = "GymTrackOffline";
    const STORE_NAME = "pendingMemberships";
    let databasePromise = null;

    function openOfflineDB() {
        if (databasePromise) {
            return databasePromise;
        }

        databasePromise = new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(new Error("IndexedDB is not supported."));
                return;
            }

            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "offline_id"
                    });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };

            request.onblocked = () => {
                console.error("Offline database upgrade is blocked.");
            };
        }).catch(error => {
            
            databasePromise = null;
            throw error;
        });

        return databasePromise;
    }

    async function saveOfflineMembership(data) {
        const db = await openOfflineDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).put(data);

            transaction.oncomplete = () => resolve();

            transaction.onerror = () => {
                reject(transaction.error);
            };

            transaction.onabort = () => {
                reject(transaction.error || new Error(
                    "Could not save membership offline."
                ));
            };
        });
    }

    async function getPendingMemberships() {
        const db = await openOfflineDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_NAME,
                "readonly"
            );

            const request = transaction
                .objectStore(STORE_NAME)
                .getAll();

            request.onsuccess = () => resolve(request.result);

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function removePendingMembership(offlineId) {
        const db = await openOfflineDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).delete(offlineId);

            transaction.oncomplete = () => resolve();

            transaction.onerror = () => {
                reject(transaction.error);
            };

            transaction.onabort = () => {
                reject(transaction.error || new Error(
                    "Could not update offline storage."
                ));
            };
        });
    }

    function createOfflineId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `membership-${Date.now()}-${Math.random()
            .toString(36).slice(2)}`;
    }

    async function updatePendingCount() {
        const status = document.getElementById("offline-status");

        if (!status) return;

        try {
            const pending = await getPendingMemberships();

            status.textContent = navigator.onLine
                ? `Online · ${pending.length} pending membership(s)`
                : `Offline · ${pending.length} pending membership(s)`;
        } catch (error) {
            console.error("Could not read pending memberships:", error);

            status.textContent = navigator.onLine
                ? "Online · Offline storage unavailable"
                : "Offline · Unable to access offline storage";
        }
    }

    let isSyncing = false;

    async function syncMemberships() {
        if (!navigator.onLine || isSyncing) return;

        isSyncing = true;

        try {
            const pending = await getPendingMemberships();

            for (const membership of pending) {
                // Stop if the connection disappears.
                if (!navigator.onLine) break;

                try {
                    const result = await api.post(
                        "create_membership.php",
                        membership
                    );

                    if (result && result.success === false) {
                        console.error(
                            "Membership rejected by server:",
                            membership.offline_id,
                            result.message
                        );

                        continue;
                    }

                    await removePendingMembership(
                        membership.offline_id
                    );

                    console.log(
                        "Membership synchronized:",
                        membership.offline_id
                    );
                } catch (error) {
                    console.error(
                        "Membership sync failed; record remains queued:",
                        membership.offline_id,
                        error
                    );

                    break;
                }
            }
        } catch (error) {
            console.error("Could not synchronize memberships:", error);
        } finally {
            isSyncing = false;
            await updatePendingCount();
        }
    }

    document.querySelectorAll(".avail-btn").forEach(button => {
        button.addEventListener("click", () => {
            openModal(button.dataset.plan);
        });
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    startDate.addEventListener("change", () => {
        expirationDate.value = addOneMonth(startDate.value);
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.textContent = "";
        message.className = "";

        if (!form.reportValidity()) return;

        if (!allowedPlans.includes(planInput.value)) {
            message.textContent = "Please select a membership plan.";
            return;
        }

        const currentDate = localDateString(new Date());

        if (startDate.value < currentDate) {
            message.textContent = "The start date cannot be in the past.";
            return;
        }

        expirationDate.value = addOneMonth(startDate.value);

        const data = Object.fromEntries(
            new FormData(form).entries()
        );

        const requestData = {
            ...data,
            offline_id: createOfflineId()
        };

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            if (!navigator.onLine) {
            
                await saveOfflineMembership(requestData);

                message.textContent =
                    "Membership saved on this device. It will sync when you're online.";

                message.className = "success";

                if (typeof showToast === "function") {
                    showToast("Membership saved offline");
                }

                form.reset();
                planDisplay.value = "";
                planInput.value = "";
                resetDates();

                await updatePendingCount();

                setTimeout(() => {
                    closeModal();
                    message.textContent = "";
                }, 2500);

                return;
            }

            try {
    
                const result = await api.post(
                    "create_membership.php",
                    requestData
                );

                if (result && result.success === false) {
                    throw new Error(
                        result.message || "Membership registration failed."
                    );
                }

                message.textContent =
                    result.message || "Membership registered successfully.";

                message.className = "success";

                if (typeof showToast === "function") {
                    showToast("Membership registered");
                }

                form.reset();
                planDisplay.value = "";
                planInput.value = "";
                resetDates();

                setTimeout(() => {
                    closeModal();
                    message.textContent = "";
                }, 2500);
            } catch (error) {

                const networkFailure =
                    !navigator.onLine ||
                    /failed to fetch|networkerror|network request failed|load failed|fetch failed/i
                        .test(error.message || "");

                if (!networkFailure) {
                    throw error;
                }

                await saveOfflineMembership(requestData);

                message.textContent =
                    "The server could not be reached. Membership saved on this device and waiting to sync.";

                message.className = "success";

                if (typeof showToast === "function") {
                    showToast("Membership saved offline");
                }

                form.reset();
                planDisplay.value = "";
                planInput.value = "";
                resetDates();

                await updatePendingCount();

                setTimeout(() => {
                    closeModal();
                    message.textContent = "";
                }, 2500);
            }
        } catch (error) {
            console.error("Membership registration error:", error);

            message.textContent = error.message ||
                "Could not save membership. Please try again.";

            message.className = "error";

            if (typeof showToast === "function") {
                showToast(
                    error.message || "Could not save membership.",
                    "error"
                );
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Register Membership";
        }
    });

    window.addEventListener("online", () => {
        updatePendingCount();
        syncMemberships();
    });

    window.addEventListener("offline", () => {
        updatePendingCount();
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updatePendingCount();

            if (navigator.onLine) {
                syncMemberships();
            }
        }
    });

    updatePendingCount();

    if (navigator.onLine) {
        syncMemberships();
    }
});
