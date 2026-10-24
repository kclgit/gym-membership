document.addEventListener("DOMContentLoaded", function () {
    const qrContainer = document.getElementById("gym-qr-code");
    const qrBorder = document.getElementById("check-in-border");

    if (!qrContainer || !qrBorder) {
        console.error("QR code container or border not found.");
        return;
    }

    if (typeof QRCode === "undefined") {
        console.error("QR code library did not load.");
        return;
    }

    // Automatically use the current host, protocol, and port.
    const qrURL = new URL("./index.html", window.location.href).href;

    console.log("GymTrack QR URL:", qrURL);

    qrContainer.innerHTML = "";

    new QRCode(qrContainer, {
        text: qrURL,
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
});
