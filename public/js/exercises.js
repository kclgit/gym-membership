// Controls adding and deleting exercises in the custom workout modal

// Get the container where exercise rows go and the "+ Add Exercise" button
const exerciseList = document.querySelector('.exercise-list');
const addExerciseBtn = document.querySelector('.add-exercise-btn');

// Function to make a new exercise input row
function createExerciseRow() {
  const row = document.createElement('div');
  row.className = 'exercise-item';
  row.innerHTML = `
    <input type="text" name="exercise" placeholder="Exercise name">
    <button type="button" class="remove-btn" aria-label="Remove exercise">&times;</button>
  `;
  return row;
}

// Read the entered exercises back out (trimmed, empty ones dropped)
function getExercises() {
  if (!exerciseList) return [];
  return Array.from(exerciseList.querySelectorAll('input[name="exercise"]'))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

// Guard: only wire up events when the modal exists on this page
if (exerciseList && addExerciseBtn) {
  // Add a new exercise row when "+ Add Exercise" is clicked
  addExerciseBtn.addEventListener('click', () => {
    exerciseList.appendChild(createExerciseRow());
  });

  // Remove an exercise row when the "×" button is clicked
  exerciseList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-btn');
    if (!removeBtn) return;
    // Keep at least 1 exercise on the list
    if (exerciseList.children.length > 1) {
      removeBtn.closest('.exercise-item').remove();
    }
  });
} else {
  console.warn('Exercise modal elements not found on this page.');
}
