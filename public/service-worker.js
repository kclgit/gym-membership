
const CACHE_NAME = "gymtrack-v4";

const APP_FILES = [
  "./",
  "./index.html",
  "./membership.html",
  "./progress.html",
  "./workout.html",
  "./offline.html",
  "./manifest.json",
  "./favicon.svg",

  // JavaScript
  "./js/app.js",
  "./js/api.js",
  "./js/exercises.js",
  "./js/workout.js",
  "./js/nav.js",
  "./js/toast.js",
  "./js/loading.js",
  "./js/modal.js",
  "./js/membership.js",
  "./js/qr-code.js",
  "./js/sessions.js",
  "./js/custom-workouts.js",
  "./js/weights.js",
  "./js/progress.js",
  "./js/progress-stats.js",
  "./js/offline.js",
  "./js/offline-db.js",

  // CSS
  "./styles/style.css",
  "./styles/membership.css",
  "./styles/create_membership.css",
  "./styles/progress.css",
  "./styles/workout.css",
  "./styles/offline.css",

  // Existing images
  "./Images/BackgroundImage2.jpg",
  "./Images/GymImage.jpg",
  "./Images/MembershipImage.png",
  "./Images/ProgressBackground.jpg",
  "./Images/Qr-Code.png",
  "./Images/UserProfile.jpeg",
  "./Images/WorkoutBackground.jpg",
  "./Images/cardio.jpg",
  "./Images/hiit.jpg",
  "./Images/popularworkoutbackground.jpg",
  "./Images/strength.jpg",
  "./Images/strengthandpowerbackground.jpg",
  "./Images/yoga.jpg"
];

// Install: save the app's essential files for offline use.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const urls = APP_FILES.map(
        (path) => new URL(path, self.registration.scope).href
      );

      await cache.addAll(urls);
    })
  );

  self.skipWaiting();
});

// Activate: remove old GymTrack caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("gymtrack-") &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// Fetch: pages use network-first; static assets use cache-first.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);

  // Ignore other websites.
  if (requestUrl.origin !== scopeUrl.origin) return;

  // Never cache API/backend requests as static files.
  if (
    requestUrl.pathname.includes("/backend/") ||
    requestUrl.pathname.includes("/api/")
  ) {
    return;
  }

  // HTML navigation: try the server, then cached page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          const offlinePage = await caches.match(
              new URL("./offline.html", self.registration.scope).href
          );

          return offlinePage || new Response(
            "You are offline. Reconnect and try again.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }

// CSS, JavaScript and images:
// Use the cache first when offline; update from the network when online.
event.respondWith(
    (async () => {
        if (!navigator.onLine) {
            const cached = await caches.match(request);

            if (cached) {
                return cached;
            }
        }

        try {
            const response = await fetch(request);

            if (response.ok) {
                const copy = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, copy);
                });
            }

            return response;
        } catch (error) {
            const cached = await caches.match(request);

            if (cached) {
                return cached;
            }

            return new Response("Asset unavailable offline.", {
                status: 503,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8"
                }
            });
        }
    })()
);
});
