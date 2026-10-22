// Custom workout modal: open/close behavior and saving a custom workout

const modalToggle = document.querySelector('#modal-toggle');
const overlay = document.querySelector('.modal-overlay');
const modalBox = document.querySelector('.modal');
const createBtn = document.querySelector('.create-btn');
const workoutName = document.querySelector('#workoutName');

// Remember what opened the modal so focus can return to it
let lastTrigger = null;

function isOpen() {
  return !!(modalToggle && modalToggle.checked);
}

function openModal(trigger) {
  lastTrigger = trigger || lastTrigger;
  modalToggle.checked = true;          // CSS shows/hides the modal
  document.body.style.overflow = 'hidden';
  if (workoutName) workoutName.focus();
}

function closeModal() {
  if (!modalToggle) return;
  modalToggle.checked = false;
  document.body.style.overflow = '';
  if (lastTrigger) lastTrigger.focus();
}

// Mark the modal box as a dialog
if (modalBox) {
  modalBox.setAttribute('role', 'dialog');
  modalBox.setAttribute('aria-modal', 'true');
}

if (modalToggle && overlay) {
  // Open when "+ Custom Workout" is clicked
  if (createBtn) {
    createBtn.addEventListener('click', () => openModal(createBtn));
  }

  // Close on × or Cancel
  document.querySelectorAll('.close-btn, .btn-cancel').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  // Close when clicking the dark background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeModal();
  });
} else {
  console.warn('Custom workout modal elements not found on this page.');
}

const saveWorkoutBtn = document.getElementById('save-workout-btn');

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('workoutName').value.trim();
    const typeInput = document.getElementById('workoutType').value;
    const durationInput = document.getElementById('workoutDuration').value || '30';

    // Exercises come from exercises.js (single source of truth)
    const customExercises = typeof getExercises === 'function' ? getExercises() : [];

    if (nameInput === '') {
      showToast('Please enter a workout name!', 'error');
      return;
    }

    if (typeof GymTrackCustomWorkouts === 'undefined') {
      showToast('Workout storage is unavailable.', 'error');
      return;
    }

    const workoutGrid = document.querySelector('.workout-grid');
    if (!workoutGrid) return;

    // Save first so the card survives a reload.
    const savedWorkout = GymTrackCustomWorkouts.save({
      name: nameInput,
      type: typeInput,
      duration: durationInput,
      exercises: customExercises
    });

    const newCard = GymTrackCustomWorkouts.createCard(savedWorkout);
    workoutGrid.prepend(newCard);

    // A category filter would hide the new card, so show everything again.
    const allFilter = document.getElementById('filter-all');
    if (allFilter) allFilter.checked = true;

    // Bring the new card into view and highlight it briefly.
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    newCard.classList.add('just-added');
    setTimeout(() => newCard.classList.remove('just-added'), 1600);

    if (typeof showToast === 'function') {
      showToast('Custom workout added');
    }

    // Clear the form
    document.getElementById('workoutName').value = '';
    document.getElementById('workoutDuration').value = '';
    document.querySelectorAll('.exercise-item input').forEach((input) => { input.value = ''; });

    closeModal();
  });
}
