// Grab the elements from the HTML so we can control them
const modalToggle = document.querySelector('#modal-toggle');
const overlay = document.querySelector('.modal-overlay');
const modalBox = document.querySelector('.modal');

// --- OPENING THE MODAL ---
function openModal() {
  // Make the dark background and the white modal box visible
  overlay.style.opacity = '1';
  overlay.style.visibility = 'visible';
  
  // Slide the modal box up into its normal position
  modalBox.style.transform = 'translateY(0)';
  
  // Stop the background page from scrolling while the modal is open
  document.body.style.overflow = 'hidden';
}

// --- CLOSING THE MODAL ---
function closeModal() {
  // Fade out the dark background and make it unclickable
  overlay.style.opacity = '0';
  overlay.style.visibility = 'hidden';
  
  // Slide the modal box back down out of view
  modalBox.style.transform = 'translateY(20px)';
  
  // Keep the hidden checkbox in sync (just in case the CSS needs it)
  modalToggle.checked = false; 
}

// --- EVENT LISTENERS (Making the buttons work) ---

// 1. Open the modal when the user clicks the "+ Custom Workout" button
document.querySelector('.create-btn').addEventListener('click', openModal);

// 2. Close the modal when the user clicks the "×" or "Cancel" buttons
document.querySelectorAll('.close-btn, .btn-cancel').forEach((el) =>
  el.addEventListener('click', closeModal)
);

// 3. Close the modal if the user clicks on the dark background (but not inside the white box)
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

// 4. Close the modal if the user presses the "Escape" key on their keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.style.visibility === 'visible') {
    closeModal();
  }
});