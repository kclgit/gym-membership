// Controls adding and deleting exercises in the custom workout modal

const exerciseList = document.querySelector('.exercise-list');
const addExerciseBtn = document.querySelector('.add-exercise-btn');

// Max number of exercise rows
const MAX_EXERCISES = 10;

// Turn a saved exercise into the shape the form uses.
function normalizeExercise(value) {
  if (typeof value === 'string') {
    return { name: value, sets: null, reps: null };
  }

  if (!value || typeof value !== 'object') {
    return { name: '', sets: null, reps: null };
  }

  const sets = Number(value.sets);
  const reps = Number(value.reps);

  return {
    name: String(value.name || ''),
    sets: Number.isInteger(sets) && sets > 0 ? sets : null,
    reps: Number.isInteger(reps) && reps > 0 ? reps : null
  };
}

// Create a new exercise row. New rows start with common 3 x 10 values.
function createExerciseRow(exercise) {
  const isNew = exercise === undefined;
  const data = isNew
    ? { name: '', sets: 3, reps: 10 }
    : normalizeExercise(exercise);

  const row = document.createElement('div');
  row.className = 'exercise-item';
  row.innerHTML = `
    <input type="text" name="exercise" list="exercise-options"
           placeholder="Type or choose an exercise" aria-label="Exercise name">
    <input type="number" name="exercise-sets" min="1" max="20" step="1"
           placeholder="Sets" aria-label="Sets" inputmode="numeric">
    <input type="number" name="exercise-reps" min="1" max="100" step="1"
           placeholder="Reps" aria-label="Reps" inputmode="numeric">
    <button type="button" class="remove-btn" aria-label="Remove exercise">&times;</button>
  `;

  row.querySelector('input[name="exercise"]').value = data.name;
  row.querySelector('input[name="exercise-sets"]').value = data.sets ?? '';
  row.querySelector('input[name="exercise-reps"]').value = data.reps ?? '';
  return row;
}

// Return the entered exercises, trimmed and non-empty, with optional sets/reps.
function getExercises() {
  if (!exerciseList) return [];

  return Array.from(exerciseList.children)
    .map((row) => {
      const name = row.querySelector('input[name="exercise"]').value.trim();
      const sets = parseInt(row.querySelector('input[name="exercise-sets"]').value, 10);
      const reps = parseInt(row.querySelector('input[name="exercise-reps"]').value, 10);

      return {
        name,
        sets: Number.isInteger(sets) && sets > 0 ? sets : null,
        reps: Number.isInteger(reps) && reps > 0 ? reps : null
      };
    })
    .filter((exercise) => exercise.name);
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
