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

const saveWorkoutBtnNew = document.getElementById('save-workout-btn');

if (saveWorkoutBtnNew) {
    saveWorkoutBtnNew.addEventListener('click', () => {
        const nameInput = document.getElementById('workoutName').value;
        const typeInput = document.getElementById('workoutType').value;
        const durationInput = document.getElementById('workoutDuration').value || '30'; 
        
        // Grab the exercises the user typed in!
        const exerciseInputs = document.querySelectorAll('.exercise-item input');
        const customExercises = [];
        exerciseInputs.forEach(input => {
            if (input.value.trim() !== '') {
                customExercises.push(input.value.trim());
            }
        });

        if (nameInput.trim() === '') {
            alert("Please enter a workout name!");
            return; 
        }

        const workoutGrid = document.querySelector('.workout-grid');
        const newCard = document.createElement('div');
        newCard.className = 'workout-card';
        newCard.setAttribute('data-category', typeInput); 
        
        // 🔥 THIS IS THE FIX: We save the exercises into the HTML card
        newCard.setAttribute('data-exercises', JSON.stringify(customExercises));

        let imgUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"; 
        if(typeInput === 'yoga') imgUrl = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1470&auto=format&fit=crop";
        if(typeInput === 'hiit') imgUrl = "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop";
        if(typeInput === 'cardio') imgUrl = "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1374&auto=format&fit=crop";

        newCard.innerHTML = `
            <div class="card-image" style="background-image: url('${imgUrl}');">
              <span class="tag ${typeInput}">${typeInput}</span>
            </div>
            <div class="card-content">
              <h3>${nameInput}</h3>
              <div class="card-stats">
                <span>⏱ ${durationInput} min</span>
                <span>🔥 Custom</span>
              </div>
              <button class="start-btn">Start Workout</button>
            </div>
        `;

        workoutGrid.prepend(newCard);

        // Clear form
        document.getElementById('workoutName').value = '';
        document.getElementById('workoutDuration').value = '';
        document.querySelectorAll('.exercise-item input').forEach(input => input.value = '');

        // Close modal
        document.getElementById('modal-toggle').checked = false;
    });
}