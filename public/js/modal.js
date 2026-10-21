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

    const workoutGrid = document.querySelector('.workout-grid');
    const newCard = document.createElement('div');
    newCard.className = 'workout-card';
    newCard.setAttribute('data-category', typeInput);
    newCard.setAttribute('data-exercises', JSON.stringify(customExercises));

    const imgUrl = `Images/${typeInput}.jpg`;

    newCard.innerHTML = `
      <div class="card-image" style="background-image: url('${imgUrl}');">
        <span class="tag ${typeInput}">${escapeHtml(typeInput)}</span>
      </div>
      <div class="card-content">
        <h3>${escapeHtml(nameInput)}</h3>
        <div class="card-stats">
          <span>⏱ ${escapeHtml(durationInput)} min</span>
          <span>🔥 Custom</span>
        </div>
        <button class="start-btn">Start Workout</button>
      </div>
    `;

    workoutGrid.prepend(newCard);

    // Clear the form
    document.getElementById('workoutName').value = '';
    document.getElementById('workoutDuration').value = '';
    document.querySelectorAll('.exercise-item input').forEach((input) => { input.value = ''; });

    closeModal();
  });
}

// Escape user input before putting it into innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
