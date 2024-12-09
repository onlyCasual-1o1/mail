document.addEventListener("DOMContentLoaded", function () {
    // Ensure the email modal is hidden by default
    document.getElementById("emailModal").style.display = "none";

    // Get modal elements for Email Account
    var emailModal = document.getElementById("emailModal");
    var emailBtn = document.getElementById("emailBtn");
    var emailClose = document.getElementById("emailClose");

    // Open Email Account modal when button is clicked
    emailBtn.onclick = function () {
        emailModal.style.display = "flex"; // Show the modal
    };

    // Close Email Account modal when close button is clicked
    emailClose.onclick = function () {
        emailModal.style.display = "none"; // Hide the modal
    };

    // Close the email modal if user clicks outside of the modal content
    window.onclick = function (event) {
        if (event.target === emailModal) {
            emailModal.style.display = "none";
        }
    };
});
