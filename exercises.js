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

