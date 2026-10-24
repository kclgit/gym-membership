// Custom workouts created from the modal, persisted in localStorage.
(function () {
  const KEY = 'gymtrack:customWorkouts';
  const MAX_WORKOUTS = 50;

  // kcal per minute, used to estimate calories from intensity.
  const INTENSITY_RATES = { low: 5, medium: 8, high: 12 };
  const INTENSITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

  function normalizeIntensity(value) {
    return Object.prototype.hasOwnProperty.call(INTENSITY_RATES, value) ? value : '';
  }

  function estimateKcal(duration, intensity) {
    const rate = INTENSITY_RATES[normalizeIntensity(intensity)];
    if (!rate) return 0;

    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes <= 0) return 0;

    return Math.max(1, Math.round(minutes * rate));
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_WORKOUTS)));
    } catch (err) {
      // Storage unavailable or full; the card still shows until reload.
    }
  }

  function save(data) {
    const duration = Math.max(1, Math.round(Number(data.duration) || 30));
    const intensity = normalizeIntensity(data.intensity);

    const workout = {
      id: 'custom-' + Date.now(),
      name: String(data.name || 'Custom Workout'),
      type: String(data.type || 'strength'),
      duration,
      intensity,
      kcal: estimateKcal(duration, intensity),
      exercises: Array.isArray(data.exercises) ? data.exercises : [],
      createdAt: new Date().toISOString()
    };

    write(read().concat(workout));
    return workout;
  }

  function update(id, data) {
    if (!id) return null;

    const list = read();
    const index = list.findIndex((workout) => workout.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const duration = Math.max(1, Math.round(Number(data.duration) || existing.duration || 30));
    const intensity = normalizeIntensity(
      data.intensity !== undefined ? data.intensity : existing.intensity
    );

    const workout = {
      ...existing,
      name: String(data.name || existing.name || 'Custom Workout'),
      type: String(data.type || existing.type || 'strength'),
      duration,
      intensity,
      kcal: estimateKcal(duration, intensity),
      exercises: Array.isArray(data.exercises) ? data.exercises : existing.exercises,
      updatedAt: new Date().toISOString()
    };

    list[index] = workout;
    write(list);
    return workout;
  }

  function clear() {
    write([]);
  }

  function remove(id) {
    if (!id) return false;

    const list = read();
    const remaining = list.filter((workout) => workout.id !== id);
    if (remaining.length === list.length) return false;

    write(remaining);
    return true;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createCard(workout) {
    const card = document.createElement('div');
    card.className = 'workout-card';
    card.setAttribute('data-id', workout.id);
    card.setAttribute('data-category', workout.type);
    card.setAttribute('data-custom', 'true');
    card.setAttribute('data-exercises', JSON.stringify(workout.exercises));

    const type = escapeHtml(workout.type);
    const name = escapeHtml(workout.name);
    const intensity = normalizeIntensity(workout.intensity);
    const intensityLabel = INTENSITY_LABELS[intensity] || '';
    const kcal = Number(workout.kcal) > 0
      ? Math.round(Number(workout.kcal))
      : estimateKcal(workout.duration, intensity);
    const energy = kcal > 0 ? `🔥 ${kcal} kcal` : '🔥 Custom';
    const energyTitle = intensityLabel ? `${intensityLabel} intensity` : 'Custom workout';

    card.innerHTML = `
      <div class="card-image" style="background-image: url('Images/${type}.jpg');">
        <span class="tag ${type}">${type}</span>
        <button type="button" class="edit-workout-btn" aria-label="Edit ${name}" title="Edit workout">&#9998;</button>
        <button type="button" class="delete-workout-btn" aria-label="Delete ${name}" title="Delete workout">&times;</button>
      </div>
      <div class="card-content">
        <h3>${name}</h3>
        <div class="card-stats">
          <span>⏱ ${workout.duration} min</span>
          <span title="${escapeHtml(energyTitle)}">${energy}</span>
        </div>
        <button class="start-btn">Start Workout</button>
      </div>
    `;

    return card;
  }

  function renderSaved() {
    const grid = document.querySelector('.workout-grid');
    if (!grid) return;

    // Oldest first, so the newest card ends up at the top after prepending.
    read().forEach((workout) => {
      grid.prepend(createCard(workout));
    });
  }

  // Delete a saved workout. Only custom cards render the delete button.
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('.delete-workout-btn');
    if (!button) return;

    const card = button.closest('.workout-card');
    if (!card) return;

    const name = card.querySelector('h3').textContent;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    if (!remove(card.getAttribute('data-id'))) return;

    card.remove();

    if (typeof showToast === 'function') {
      showToast('Workout deleted');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSaved);
  } else {
    renderSaved();
  }

  window.GymTrackCustomWorkouts = {
    key: KEY,
    read,
    save,
    update,
    remove,
    clear,
    createCard,
    estimateKcal
  };
})();
