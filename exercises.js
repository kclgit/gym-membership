// Makes the "+ Add Exercise" works aswell as "×" buttons in the custom workout modal.

const exerciseList = document.querySelector('.exercise-list');

function createExerciseRow() {
  const row = document.createElement('div');
  row.className = 'exercise-item';
  row.innerHTML = `
    <input type="text" placeholder="Exercise name">
    <span class="remove-btn">&times;</span>
  `;
  return row;
}

document.querySelector('.add-exercise-btn').addEventListener('click', () => {
  exerciseList.appendChild(createExerciseRow());
});

exerciseList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-btn')) {
    if (exerciseList.children.length > 1) {
      e.target.closest('.exercise-item').remove();
    }
  }
});