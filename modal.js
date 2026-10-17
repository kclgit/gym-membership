const modalToggle = document.querySelector('#modal-toggle');
const overlay = document.querySelector('.modal-overlay');
const modalBox = document.querySelector('.modal');

function openModal() {
  // Show the dark background and the white box
  overlay.style.opacity = '1';
  overlay.style.visibility = 'visible';
  modalBox.style.transform = 'translateY(0)';
  
  // Stop background scrolling
  document.body.style.overflow = 'hidden';
  
  // Put the typing cursor in the "Workout Name" box
  document.querySelector('#workoutName').focus();
}

function closeModal() {
  // Hide the dark background and slide the box down
  overlay.style.opacity = '0';
  overlay.style.visibility = 'hidden';
  modalBox.style.transform = 'translateY(20px)';
  
  modalToggle.checked = false; 
  
  // Allow background scrolling again
  document.body.style.overflow = '';
}

// 1. Open the modal when clicking "+ Custom Workout"
document.querySelector('.create-btn').addEventListener('click', openModal);

// 2. Close the modal when clicking "×" or "Cancel"
document.querySelectorAll('.close-btn, .btn-cancel').forEach((el) =>
  el.addEventListener('click', closeModal)
);

// 3. Close the modal when clicking the dark background
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

// 4. Close the modal when pressing the Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.style.visibility === 'visible') {
    closeModal();
  }
});