// Workout library: details modal, countdown timer, and exercise suggestions

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const detailsModal = document.getElementById('details-modal');
  const detailsTitle = document.getElementById('details-title');
  const detailsExerciseList = document.getElementById('details-exercise-list');
  const closeDetailsBtn = document.getElementById('close-details-btn');
  const cancelDetailsBtn = document.getElementById('cancel-details-btn');
  const startTimerBtn = document.getElementById('start-timer-btn');
  const successToggle = document.getElementById('success-toggle');
  const exerciseOptions = document.getElementById('exercise-options');
  const timerOverlay = document.getElementById('timer-overlay');
  const timerDisplay = document.getElementById('timer-display');
  const timerName = document.getElementById('timer-workout-name');
  const finishTimerBtn = document.getElementById('finish-timer-btn');

  // The workout currently shown in the details modal
  let currentWorkout = { title: 'Workout', minutes: 30 };
  let timerInterval = null;
  let lastDetailsTrigger = null;

  // Anything shorter is treated as an accidental start and not saved.
  const MIN_SESSION_SECONDS = 60;

  // Pull the duration (in minutes) out of a card's stats, e.g. "⏱ 45 min"
  function getCardDuration(card) {
    const stats = card.querySelectorAll('.card-stats span');
    for (const span of stats) {
      const match = span.textContent.match(/(\d+)\s*min/i);
      if (match) return parseInt(match[1], 10);
    }
    return 30;
  }

  // Load exercise suggestions from the backend for the custom workout form
  async function loadExercises() {
    if (!exerciseOptions) return;

    try {
      const res = await api.get('exercises.php');
      exerciseOptions.innerHTML = '';
      (res.data || []).forEach((exercise) => {
        const option = document.createElement('option');
        option.value = exercise.exercise_name;
        exerciseOptions.appendChild(option);
      });
    } catch (err) {
      // The form still works with free-text input, so just warn
      console.warn('Could not load exercises:', err.message);
    }
  }

  loadExercises();

  // Show the details modal when a Start Workout button is clicked
  document.body.addEventListener('click', (e) => {
    const startBtn = e.target.closest('.start-btn');
    if (!startBtn || !detailsModal) return;

    const card = startBtn.closest('.workout-card');
    if (!card) return;

    // Every card carries its own routine, so custom and built-in share one path.
    const titleToDisplay = card.querySelector('h3').innerText;
    let exercisesToDisplay = [];

    try {
      exercisesToDisplay = JSON.parse(card.getAttribute('data-exercises') || '[]');
    } catch (err) {
      exercisesToDisplay = [];
    }

    if (!exercisesToDisplay.length) {
      exercisesToDisplay = ['No exercises listed yet.'];
    }

    currentWorkout = {
      title: titleToDisplay,
      minutes: getCardDuration(card)
    };

    lastDetailsTrigger = startBtn;

    detailsTitle.innerText = titleToDisplay;
    detailsExerciseList.innerHTML = '';
    exercisesToDisplay.forEach((exercise) => {
      const li = document.createElement('li');
      li.innerText = exercise;
      detailsExerciseList.appendChild(li);
    });

    detailsModal.classList.add('active');

    // Move focus into the dialog so keyboard users do not stay on the card.
    // Wait a frame: the overlay is still visibility:hidden during this tick.
    requestAnimationFrame(() => {
      const focusTarget = startTimerBtn || closeDetailsBtn;
      if (focusTarget) focusTarget.focus();
    });
  });

  // Close the details modal
  function closeDetailsModal() {
    if (!detailsModal) return;
    detailsModal.classList.remove('active');

    if (lastDetailsTrigger) {
      lastDetailsTrigger.focus();
      lastDetailsTrigger = null;
    }
  }

  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeDetailsModal);
  if (cancelDetailsBtn) cancelDetailsBtn.addEventListener('click', closeDetailsModal);

  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) closeDetailsModal();
    });
  }

  // Escape closes the details dialog, like the other modals on the site.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailsModal && detailsModal.classList.contains('active')) {
      closeDetailsModal();
    }
  });

  // Run the countdown for the selected workout, then show the success popup
  function startTimer(minutes, title) {
    if (!timerOverlay || !timerDisplay) return;

    let remaining = minutes * 60; // seconds
    const startedAt = Date.now();

    if (timerName) timerName.textContent = title;

    // Log the session start to the backend (best effort)
    const sessionPromise = api
      .post('workout_session.php', { action: 'start', workout_name: title })
      .then((res) => res.session_id)
      .catch((err) => {
        console.warn('Could not start session:', err.message);
        return null;
      });

    function render() {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      timerDisplay.textContent = `${m}:${s}`;
    }

    function stop() {
      clearInterval(timerInterval);
      timerInterval = null;
      timerOverlay.classList.remove('active');
    }

    let finished = false;

    async function finish() {
      if (finished) return;
      finished = true;
      stop();

      const sessionId = await sessionPromise;
      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      const tooShort = durationSeconds < MIN_SESSION_SECONDS;

      // Keep a local copy so the Progress page can show this session.
      // Sessions under a minute are not worth logging.
      if (!tooShort && window.GymTrackSessions) {
        window.GymTrackSessions.saveSession({ name: title, durationSeconds });
      }

      if (sessionId) {
        try {
          await api.post('workout_session.php', {
            action: 'finish',
            session_id: sessionId,
            duration_seconds: durationSeconds
          });
        } catch (err) {
          showToast(err.message, 'error');
          return;
        }
      }

      showToast(tooShort ? 'Session under a minute was not saved.' : 'Workout saved!');
    }

    clearInterval(timerInterval);
    render();
    timerOverlay.classList.add('active');

    if (finishTimerBtn) finishTimerBtn.onclick = finish;

    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        finish();
      } else {
        render();
      }
    }, 1000);
  }

  // Show the "Workout Started!" popup first, then start the timer when dismissed
  let pendingWorkout = null;

  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      closeDetailsModal();
      pendingWorkout = currentWorkout;
      if (successToggle) successToggle.checked = true;
    });
  }

  const successBtn = document.querySelector('.success-btn');
  if (successBtn) {
    successBtn.addEventListener('click', () => {
      if (!pendingWorkout) return;
      const { minutes, title } = pendingWorkout;
      pendingWorkout = null;
      startTimer(minutes, title);
    });
  }
});
