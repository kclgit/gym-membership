// Controls adding and deleting exercises in the custom workout modal

// Get the container where exercise rows go
const exerciseList = document.querySelector('.exercise-list');

// Function to make a new exercise input row
function createExerciseRow() {
  const row = document.createElement('div');
  row.className = 'exercise-item';
  row.innerHTML = `
    <input type="text" placeholder="Exercise name">
    <span class="remove-btn">&times;</span>
  `;
  return row;
}
// Add a new exercise row when "+ Add Exercise" is clicked
document.querySelector('.add-exercise-btn').addEventListener('click', () => {
  exerciseList.appendChild(createExerciseRow());
});

// Remove an exercise row when the "×" button is clicked
exerciseList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-btn')) {
    // Keep at least 1 exercise on the list
    if (exerciseList.children.length > 1) {
      e.target.closest('.exercise-item').remove();
    }
  }
});

