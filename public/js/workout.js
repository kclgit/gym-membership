document.addEventListener('DOMContentLoaded', () => {
    
    // 1. THE DEFAULT DATA
    const workoutData = {
        'strength': {
            title: 'Full Body Power',
            exercises: ['3x10 Barbell Squats', '3x8 Bench Press', '3x10 Deadlifts', '3x12 Dumbbell Lunges']
        },
        'hiit': {
            title: 'Morning Sweat',
            exercises: ['45 sec Burpees', '45 sec Mountain Climbers', '45 sec Jumping Jacks', '45 sec High Knees']
        },
        'yoga': {
            title: 'Deep Stretch & Flow',
            exercises: ['5 mins Childs Pose', '10 mins Downward Dog', '5 mins Cobra Pose', '5 mins Savasana']
        },
        'cardio': {
            title: 'Treadmill Intervals',
            exercises: ['5 mins Warmup Walk', '1 min Sprint / 2 min Jog (Repeat 5x)', '5 mins Cooldown Walk']
        }
    };

    // 2. DOM ELEMENTS
    const detailsModal = document.getElementById('details-modal');
    const detailsTitle = document.getElementById('details-title');
    const detailsExerciseList = document.getElementById('details-exercise-list');
    
    const closeDetailsBtn = document.getElementById('close-details-btn');
    const cancelDetailsBtn = document.getElementById('cancel-details-btn');
    const startTimerBtn = document.getElementById('start-timer-btn');

    // 3. OPEN DETAILS MODAL
    document.body.addEventListener('click', function(e) {
        
        if (e.target.classList.contains('start-btn')) {
            
            const card = e.target.closest('.workout-card');
            const category = card.getAttribute('data-category');
            const data = workoutData[category];

            let titleToDisplay = "Custom Workout";
            let exercisesToDisplay = [];

            if (data) {
                titleToDisplay = data.title;
                exercisesToDisplay = data.exercises;
            } else {
                titleToDisplay = card.querySelector('h3').innerText;
                const savedExercises = card.getAttribute('data-exercises');
                
                if (savedExercises) {
                    exercisesToDisplay = JSON.parse(savedExercises);
                } else {
                    exercisesToDisplay = ['Do your custom exercises!'];
                }
            }

            detailsTitle.innerText = titleToDisplay;
            detailsExerciseList.innerHTML = '';
            
            exercisesToDisplay.forEach(exercise => {
                const li = document.createElement('li');
                li.innerText = exercise;
                detailsExerciseList.appendChild(li);
            });
            
            detailsModal.classList.add('active');
        }
    });

    // 4. CLOSE DETAILS MODAL
    function closeModal() {
        detailsModal.classList.remove('active');
    }

    closeDetailsBtn.addEventListener('click', closeModal);
    cancelDetailsBtn.addEventListener('click', closeModal);
    
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) closeModal();
    });

    // 5. START TIMER (Triggers Success Popup)
    startTimerBtn.addEventListener('click', () => {
        closeModal();
        document.getElementById('success-toggle').checked = true;
    });

}); 