document.addEventListener("DOMContentLoaded", function () {

    // Get the check-in section
    const checkInSection = document.getElementById("check-in");
    const qrImage = checkInSection.querySelector("img");

    // Make the QR image clickable
    qrImage.style.cursor = "pointer";

    qrImage.addEventListener("click", function () {
        // Open the existing PHP QR scanner page
        window.location.href = "http://localhost:8000/qr_checkin.php";
    });

});