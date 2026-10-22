if ("serviceWorker" in navigator) {
  // Reload once when an updated worker takes over, so stale JS isn't reused.
  let reloading = false;
  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );

      console.log(
        "GymTrack service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.error(
        "GymTrack service worker registration failed:",
        error
      );
    }
  });
}
