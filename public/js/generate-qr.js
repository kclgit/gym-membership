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

    new QRCode(qrContainer, {
        text: window.location.origin + "/check-in",
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    console.log("Gym QR code generated successfully.");
});