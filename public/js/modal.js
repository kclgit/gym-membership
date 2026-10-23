// Custom workout modal: open/close behavior and saving a custom workout

const modalToggle = document.querySelector('#modal-toggle');
const overlay = document.querySelector('.modal-overlay');
const modalBox = document.querySelector('.modal');
const createBtn = document.querySelector('.create-btn');
const workoutName = document.querySelector('#workoutName');
const modalTitle = document.getElementById('modal-title');
const saveWorkoutBtn = document.getElementById('save-workout-btn');

// Remember what opened the modal so focus can return to it
let lastTrigger = null;
let editingWorkoutId = null;

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
    createBtn.addEventListener('click', (event) => {
      // Stop the label's default checkbox toggle from reopening/undoing this.
      event.preventDefault();
      resetForm();
      openModal(createBtn);
    });
  }

  // Close on × or Cancel. Same label caveat as above.
  document.querySelectorAll('.modal .close-btn, .modal .btn-cancel').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      closeModal();
    });
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

// Replace the exercise rows with the saved ones, keeping at least one row.
function setExerciseRows(exercises) {
  const list = document.querySelector('.exercise-list');
  if (!list || typeof createExerciseRow !== 'function') return;

  const names = exercises.length ? exercises : ['', ''];

  list.innerHTML = '';
  names.slice(0, 10).forEach((name) => {
    const row = createExerciseRow();
    const input = row.querySelector('input');
    if (input) input.value = name;
    list.appendChild(row);
  });

  if (typeof updateButtons === 'function') updateButtons();
}

function resetForm() {
  editingWorkoutId = null;

  if (modalTitle) modalTitle.textContent = 'Create Custom Workout';
  if (saveWorkoutBtn) saveWorkoutBtn.textContent = 'Save Workout';

  const name = document.getElementById('workoutName');
  const type = document.getElementById('workoutType');
  const duration = document.getElementById('workoutDuration');

  if (name) {
    name.value = '';
    name.removeAttribute('aria-invalid');
  }

  if (type) type.value = 'strength';

  if (duration) {
    duration.value = '';
    duration.removeAttribute('aria-invalid');
  }

  setExerciseRows([]);
}

function openEditModal(workout, trigger) {
  if (!workout) return;

  editingWorkoutId = workout.id;

  const name = document.getElementById('workoutName');
  const type = document.getElementById('workoutType');
  const duration = document.getElementById('workoutDuration');

  if (name) {
    name.value = workout.name;
    name.removeAttribute('aria-invalid');
  }

  if (type) type.value = workout.type;

  if (duration) {
    duration.value = workout.duration;
    duration.removeAttribute('aria-invalid');
  }

  setExerciseRows(Array.isArray(workout.exercises) ? workout.exercises : []);

  if (modalTitle) modalTitle.textContent = 'Edit Custom Workout';
  if (saveWorkoutBtn) saveWorkoutBtn.textContent = 'Update Workout';

  openModal(trigger);
}

function markInvalid(input, message) {
  if (typeof showToast === 'function') showToast(message, 'error');
  if (!input) return;

  input.setAttribute('aria-invalid', 'true');
  input.focus();
  input.select();
}

['workoutName', 'workoutDuration'].forEach((id) => {
  const input = document.getElementById(id);
  if (input) input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
});

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener('click', () => {
    const nameField = document.getElementById('workoutName');
    const durationField = document.getElementById('workoutDuration');
    const nameInput = nameField.value.trim();
    const typeInput = document.getElementById('workoutType').value;
    const rawDuration = durationField.value.trim();
    const durationInput = rawDuration === '' ? 30 : Number(rawDuration);

    // Exercises come from exercises.js (single source of truth)
    const customExercises = typeof getExercises === 'function' ? getExercises() : [];

    if (nameInput === '') {
      markInvalid(nameField, 'Please enter a workout name!');
      return;
    }

    if (typeof GymTrackCustomWorkouts === 'undefined') {
      showToast('Workout storage is unavailable.', 'error');
      return;
    }

    if (!Number.isFinite(durationInput) || durationInput < 1 || durationInput > 180) {
      markInvalid(durationField, 'Duration must be between 1 and 180 minutes.');
      return;
    }

    const duplicate = GymTrackCustomWorkouts.read().some((workout) =>
      workout.id !== editingWorkoutId &&
      String(workout.name || '').trim().toLowerCase() === nameInput.toLowerCase()
    );

    if (duplicate) {
      markInvalid(nameField, 'A custom workout with that name already exists.');
      return;
    }

    const workoutGrid = document.querySelector('.workout-grid');
    if (!workoutGrid) return;

    if (editingWorkoutId) {
      const updatedWorkout = GymTrackCustomWorkouts.update(editingWorkoutId, {
        name: nameInput,
        type: typeInput,
        duration: durationInput,
        exercises: customExercises
      });

      if (!updatedWorkout) {
        showToast('That workout could not be found.', 'error');
        return;
      }

      const oldCard = document.querySelector(`.workout-card[data-id="${editingWorkoutId}"]`);
      if (oldCard) {
        const updatedCard = GymTrackCustomWorkouts.createCard(updatedWorkout);
        oldCard.replaceWith(updatedCard);

        // Keep focus on the card after the old edit button is replaced.
        const updatedEditBtn = updatedCard.querySelector('.edit-workout-btn');
        if (updatedEditBtn) lastTrigger = updatedEditBtn;

        updatedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        updatedCard.classList.add('just-added');
        setTimeout(() => updatedCard.classList.remove('just-added'), 1600);
      }

      const allFilter = document.getElementById('filter-all');
      if (allFilter) allFilter.checked = true;

      if (typeof showToast === 'function') {
        showToast('Workout updated');
      }

      resetForm();
      closeModal();
      return;
    }

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

    resetForm();
    closeModal();
  });
}

// Custom cards only render the edit button.
document.body.addEventListener('click', (event) => {
  const button = event.target.closest('.edit-workout-btn');
  if (!button || typeof GymTrackCustomWorkouts === 'undefined') return;

  const card = button.closest('.workout-card');
  if (!card) return;

  const id = card.getAttribute('data-id');
  const workout = GymTrackCustomWorkouts.read().find((item) => item.id === id);
  if (workout) openEditModal(workout, button);
});
