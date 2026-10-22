
const DB_NAME = "GymTrackOffline";
const STORE_NAME = "membershipRequests";
const DB_VERSION = 1;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveRequest(record) {
    if (!record.id) {
        throw new Error("An offline request ID is required.");
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");

        transaction.objectStore(STORE_NAME).put({
            ...record,
            syncStatus: record.syncStatus || "pending",
            createdAt: record.createdAt || new Date().toISOString()
        });

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error || new Error("Saving request failed."));
        };
    });
}

async function getAllRequests() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function getRequest(id) {
    const records = await getAllRequests();
    return records.find(record => record.id === id);
}

async function countPending() {
    const records = await getAllRequests();

    return records.filter(
        record => record.syncStatus === "pending"
    ).length;
}

async function markSynced(id, serverId) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const record = request.result;

            if (record) {
                record.syncStatus = "synced";
                record.serverId = serverId ?? null;
                record.syncedAt = new Date().toISOString();
                store.put(record);
            }
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error || new Error("Updating request failed."));
        };
    });
}

let syncing = false;

async function syncPending() {
    if (!navigator.onLine || syncing) return;

    syncing = true;

    try {
        const records = await getAllRequests();

        for (const record of records) {
            if (!navigator.onLine) break;
            if (record.syncStatus !== "pending") continue;

            try {
                const response = await fetch(
                    "/GymTrack/backend/create_membership.php",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            ...record,
                            offline_id: record.id
                        })
                    }
                );

                let result;

                try {
                    result = await response.json();
                } catch {
                    throw new Error("The server returned an invalid response.");
                }

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Server rejected the request."
                    );
                }

                await markSynced(record.id, result.member_id ?? null);
            } catch (error) {
                console.error(
                    "Membership sync failed:",
                    record.id,
                    error
                );

                break;
            }
        }
    } catch (error) {
        console.error("Could not read offline membership queue:", error);
    } finally {
        syncing = false;

        window.dispatchEvent(
            new CustomEvent("membership-sync-updated")
        );
    }
}

window.MembershipOffline = {
    saveRequest,
    getAllRequests,
    getRequest,
    countPending,
    markSynced,
    syncPending
};

window.addEventListener("online", syncPending);
window.addEventListener("pageshow", () => {
    if (navigator.onLine) syncPending();
});
