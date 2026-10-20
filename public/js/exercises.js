// Controls adding and deleting exercises in the custom workout modal

const exerciseList = document.querySelector('.exercise-list');
const addExerciseBtn = document.querySelector('.add-exercise-btn');

// Max number of exercise rows
const MAX_EXERCISES = 10;

// Create a new exercise input row
function createExerciseRow() {
  const row = document.createElement('div');
  row.className = 'exercise-item';
  row.innerHTML = `
    <input type="text" name="exercise" placeholder="Exercise name">
    <button type="button" class="remove-btn" aria-label="Remove exercise">&times;</button>
  `;
  return row;
}

// Return the entered exercises, trimmed and non-empty
function getExercises() {
  if (!exerciseList) return [];
  return Array.from(exerciseList.querySelectorAll('input[name="exercise"]'))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

// Disable remove buttons at 1 row; disable add button at the cap
function updateButtons() {
  const count = exerciseList.children.length;

  exerciseList.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.disabled = count <= 1;
  });

  addExerciseBtn.disabled = count >= MAX_EXERCISES;
}

// Add a row and focus its input
function addExerciseRow() {
  if (exerciseList.children.length >= MAX_EXERCISES) return;

  const row = createExerciseRow();
  exerciseList.appendChild(row);
  updateButtons();

  const input = row.querySelector('input');
  if (input) input.focus();
}

// Only wire up events if the modal is present
if (exerciseList && addExerciseBtn) {
  // Build the initial rows here (single source of truth)
  exerciseList.innerHTML = '';
  for (let i = 0; i < 2; i++) {
    exerciseList.appendChild(createExerciseRow());
  }
  updateButtons();

  // Add a new exercise row when "+ Add Exercise" is clicked
  addExerciseBtn.addEventListener('click', addExerciseRow);

  // Remove an exercise row when the "×" button is clicked
  exerciseList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-btn');
    if (!removeBtn || removeBtn.disabled) return;
    // Keep at least 1 exercise on the list
    if (exerciseList.children.length > 1) {
      removeBtn.closest('.exercise-item').remove();
      updateButtons();
    }
  });
} else {
  console.warn('Exercise modal elements not found on this page.');
}
