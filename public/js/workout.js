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
  const pauseTimerBtn = document.getElementById('pause-timer-btn');
  const minimizeTimerBtn = document.getElementById('minimize-timer-btn');
  const timerStatus = document.getElementById('timer-status');
  const restSelect = document.getElementById('rest-duration');
  const timerBox = timerOverlay ? timerOverlay.querySelector('.timer-box') : null;
  const timerProgressFill = document.getElementById('timer-progress-fill');

  // The workout currently shown in the details modal
  let currentWorkout = { title: 'Workout', minutes: 30 };
  // Custom exercises store sets/reps; built-in cards use plain strings.
  function describeExercise(exercise) {
    if (typeof exercise === 'string') return exercise;

    const name = String((exercise && exercise.name) || '').trim();
    if (!name) return '';

    const sets = Number(exercise.sets);
    const reps = Number(exercise.reps);
    const hasSets = Number.isInteger(sets) && sets > 0;
    const hasReps = Number.isInteger(reps) && reps > 0;

    if (hasSets && hasReps) return `${name} — ${sets} × ${reps}`;
    if (hasSets) return `${name} — ${sets} sets`;
    if (hasReps) return `${name} — ${reps} reps`;
    return name;
  }

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
      const text = describeExercise(exercise);
      if (!text) return;

      const li = document.createElement('li');
      li.innerText = text;
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

  // An in-progress workout is kept here so a reload doesn't lose it.
  const TIMER_KEY = 'gymtrack:activeTimer';

  function saveActiveTimer(data) {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(data));
    } catch (err) {
      // Storage unavailable; the timer still runs for this page load.
    }
  }

  function readActiveTimer() {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      const data = raw ? JSON.parse(raw) : null;

      if (!data || !Number.isFinite(data.minutes) || !Number.isFinite(data.startedAt)) {
        return null;
      }

      return {
        title: String(data.title || 'Workout'),
        minutes: data.minutes,
        startedAt: data.startedAt,
        paused: !!data.paused,
        pausedAt: Number.isFinite(data.pausedAt) ? data.pausedAt : 0,
        pausedMs: Number.isFinite(data.pausedMs) ? data.pausedMs : 0,
        minimized: !!data.minimized,
        restSeconds: Number.isFinite(data.restSeconds) ? data.restSeconds : 90,
        restEndsAt: Number.isFinite(data.restEndsAt) ? data.restEndsAt : 0
      };
    } catch (err) {
      return null;
    }
  }

  function clearActiveTimer() {
    try {
      localStorage.removeItem(TIMER_KEY);
    } catch (err) {
      // Nothing to clean up.
    }
  }

  // Time the timer actually ran, so rest breaks do not count.
  function activeElapsedMs(timer, now) {
    const resting = timer.paused && timer.pausedAt ? now - timer.pausedAt : 0;
    return Math.max(0, now - timer.startedAt - (timer.pausedMs || 0) - resting);
  }

  // Run the countdown for the selected workout, then show the success popup
  function startTimer(minutes, title) {
    if (!timerOverlay || !timerDisplay) return;

    const timer = {
      title,
      minutes,
      startedAt: Date.now(),
      paused: false,
      pausedAt: 0,
      pausedMs: 0,
      minimized: false,
      restSeconds: restSelect ? Number(restSelect.value) : 90,
      restEndsAt: 0
    };

    saveActiveTimer(timer);

    // Log the session start to the backend (best effort)
    const sessionPromise = api
      .post('workout_session.php', { action: 'start', workout_name: title })
      .then((res) => res.session_id)
      .catch((err) => {
        console.warn('Could not start session:', err.message);
        return null;
      });

    runTimer({ ...timer, sessionPromise });
  }

  // Shared by a fresh start and a timer restored after a reload.
  function runTimer({ title, minutes, startedAt, paused, pausedAt, pausedMs, minimized, restSeconds, restEndsAt, sessionPromise }) {
    if (!timerOverlay || !timerDisplay) return;

    const totalSeconds = Math.max(1, Math.round(minutes * 60));
    let isPaused = !!paused;
    let pauseStartedAt = pausedAt || 0;
    let pausedTotalMs = pausedMs || 0;
    let isMinimized = !!minimized;
    let restTotalSeconds = Number.isFinite(restSeconds) && restSeconds >= 0 ? restSeconds : 90;
    let restEndsAtTs = restEndsAt || 0;
    let restAlerted = restEndsAtTs > 0 && restEndsAtTs <= Date.now();
    let audioCtx = null;
    let alarmTimer = null;
    let alarmVoices = [];

    function formatClock(total) {
      const m = String(Math.floor(total / 60)).padStart(2, '0');
      const s = String(total % 60).padStart(2, '0');
      return `${m}:${s}`;
    }

    function restRemainingSeconds() {
      return restEndsAtTs ? Math.max(0, Math.ceil((restEndsAtTs - Date.now()) / 1000)) : 0;
    }

    // Created on the pause click so the browser allows the alarm later.
    function unlockAudio() {
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        if (!audioCtx) audioCtx = new AudioCtor();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch (err) {
        // Audio is optional.
      }
    }

    // Schedules one burst of three rising beeps.
    function playAlarmBurst() {
      const start = audioCtx.currentTime;
      const tones = [880, 1046, 1318];

      tones.forEach((frequency, index) => {
        const at = start + index * 0.22;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const voice = { osc, gain };

        alarmVoices.push(voice);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);

        osc.onended = () => {
          const indexOfVoice = alarmVoices.indexOf(voice);
          if (indexOfVoice !== -1) alarmVoices.splice(indexOfVoice, 1);

          try {
            osc.disconnect();
            gain.disconnect();
          } catch (err) {
            // Already disconnected.
          }
        };

        osc.connect(gain).connect(audioCtx.destination);
        osc.start(at);
        osc.stop(at + 0.18);
      });
    }

    // Repeats until the user resumes the workout.
    function startRestAlarm() {
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        if (!audioCtx) audioCtx = new AudioCtor();

        const begin = () => {
          // A quick Resume while audio was unlocking must win.
          if (!isPaused || restEndsAtTs === 0 || restEndsAtTs > Date.now()) return;

          playAlarmBurst();
          clearInterval(alarmTimer);
          alarmTimer = setInterval(playAlarmBurst, 1800);
        };

        if (audioCtx.state === 'suspended') {
          Promise.resolve(audioCtx.resume()).then(begin).catch(() => {});
        } else {
          begin();
        }

        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate([180, 80, 180, 900, 180, 80, 180]);
        }
      } catch (err) {
        // Audio is optional.
      }
    }

    function stopRestAlarm() {
      clearInterval(alarmTimer);
      alarmTimer = null;

      alarmVoices.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch (err) {
          // Already stopped.
        }
      });

      alarmVoices = [];

      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    }

    function elapsedMs() {
      return activeElapsedMs({
        startedAt,
        paused: isPaused,
        pausedAt: pauseStartedAt,
        pausedMs: pausedTotalMs
      }, Date.now());
    }

    function remainingSeconds() {
      return Math.max(0, totalSeconds - Math.floor(elapsedMs() / 1000));
    }

    if (remainingSeconds() <= 0) {
      clearActiveTimer();
      return;
    }

    if (timerName) timerName.textContent = title;

    if (restSelect) {
      const match = Array.from(restSelect.options)
        .find((option) => Number(option.value) === restTotalSeconds);

      restSelect.value = match ? match.value : '90';
      restTotalSeconds = Number(restSelect.value);

      restSelect.onchange = () => {
        const next = Number(restSelect.value);
        restTotalSeconds = Number.isFinite(next) && next >= 0 ? next : 0;

        if (!isPaused) return;

        stopRestAlarm();
        restEndsAtTs = restTotalSeconds > 0 ? Date.now() + restTotalSeconds * 1000 : 0;
        restAlerted = false;

        if (restTotalSeconds > 0) unlockAudio();

        persist();
        render();
      };
    }

    function persist() {
      saveActiveTimer({
        title,
        minutes,
        startedAt,
        paused: isPaused,
        pausedAt: pauseStartedAt,
        pausedMs: pausedTotalMs,
        minimized: isMinimized,
        restSeconds: restTotalSeconds,
        restEndsAt: restEndsAtTs
      });
    }

    function render() {
      const remaining = remainingSeconds();
      const restLeft = restRemainingSeconds();
      const restOver = isPaused && restEndsAtTs > 0 && restLeft <= 0;

      timerDisplay.textContent = formatClock(remaining);
      timerDisplay.classList.toggle('paused', isPaused);

      let state = 'normal';
      if (restOver) state = 'over';
      else if (isPaused) state = 'resting';
      else if (remaining <= 60) state = 'critical';
      else if (remaining <= 300) state = 'soon';

      if (timerBox) {
        timerBox.dataset.state = state;
        timerBox.classList.toggle('pulse', state === 'critical' && remaining <= 10);
      }

      if (timerProgressFill) {
        const ratio = Math.max(0, Math.min(1, remaining / totalSeconds));
        timerProgressFill.style.width = `${(ratio * 100).toFixed(2)}%`;
      }

      if (timerStatus) {
        timerStatus.hidden = !isPaused;

        if (isPaused) {
          timerStatus.dataset.state = restEndsAtTs
            ? (restLeft > 0 ? (restLeft <= 10 ? 'soon' : 'resting') : 'over')
            : 'resting';

          timerStatus.textContent = restEndsAtTs
            ? (restLeft > 0 ? `Resting — ${formatClock(restLeft)} left` : 'Rest over — resume when ready')
            : 'Resting — timer paused';
        }
      }

      if (pauseTimerBtn) {
        pauseTimerBtn.textContent = isPaused ? 'Resume' : 'Pause';
        pauseTimerBtn.setAttribute('aria-pressed', String(isPaused));
      }
    }

    function applyMinimized() {
      timerOverlay.classList.toggle('minimized', isMinimized);

      if (minimizeTimerBtn) {
        minimizeTimerBtn.textContent = isMinimized ? 'Expand' : 'Minimize';
        minimizeTimerBtn.setAttribute('aria-pressed', String(isMinimized));
      }
    }

    function toggleMinimize() {
      isMinimized = !isMinimized;
      applyMinimized();
      persist();
    }

    function stop() {
      stopRestAlarm();
      clearInterval(timerInterval);
      timerInterval = null;
      timerOverlay.classList.remove('active', 'minimized');
    }

    let finished = false;

    // Pause counts as rest time, so it is not added to the session.
    function togglePause() {
      if (finished) return;

      if (isPaused) {
        stopRestAlarm();
        pausedTotalMs += Date.now() - pauseStartedAt;
        pauseStartedAt = 0;
        isPaused = false;
        restEndsAtTs = 0;
        restAlerted = false;
      } else {
        isPaused = true;
        pauseStartedAt = Date.now();

        if (restTotalSeconds > 0) {
          restEndsAtTs = Date.now() + restTotalSeconds * 1000;
          restAlerted = false;
          unlockAudio();
        }
      }

      persist();
      render();
    }

    async function finish() {
      if (finished) return;
      finished = true;

      const durationSeconds = Math.max(0, Math.round(elapsedMs() / 1000));

      clearActiveTimer();
      stop();

      const sessionId = await sessionPromise;
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

    // Derive the time from the clock so background tabs don't drift.
    function tick() {
      if (isPaused) {
        render();

        if (restEndsAtTs && !restAlerted && Date.now() >= restEndsAtTs) {
          restAlerted = true;
          startRestAlarm();
          render();
        }

        return;
      }

      if (remainingSeconds() <= 0) {
        render();
        finish();
      } else {
        render();
      }
    }

    clearInterval(timerInterval);
    applyMinimized();
    render();
    timerOverlay.classList.add('active');

    if (pauseTimerBtn) pauseTimerBtn.onclick = togglePause;
    if (minimizeTimerBtn) minimizeTimerBtn.onclick = toggleMinimize;
    if (finishTimerBtn) finishTimerBtn.onclick = finish;

    timerInterval = setInterval(tick, 1000);
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

  // Reopen the timer if the page was reloaded while a workout was running.
  if (timerOverlay && timerDisplay) {
    const active = readActiveTimer();

    if (active) {
      const elapsed = Math.floor(activeElapsedMs(active, Date.now()) / 1000);

      if (elapsed < active.minutes * 60) {
        runTimer({ ...active, sessionPromise: Promise.resolve(null) });

        if (typeof showToast === 'function') {
          showToast(active.paused ? 'Resumed your rest break' : 'Resumed your workout');
        }
      } else {
        // Finished while the page was closed; do not invent a session.
        clearActiveTimer();
      }
    }
  }
});
