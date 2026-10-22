// Progress dashboard: turns stored workout sessions into live stats.
(function () {
  const store = window.GymTrackSessions;
  if (!store) return;

  const CALORIES_PER_MIN = 8;
  const WEEKLY_CALORIE_GOAL = 750;
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ?demo=1 fills the page with sample history for a quick preview.
  if (new URLSearchParams(location.search).get('demo') === '1') {
    store.seedDemo();
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function dayKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function startOfWeek(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    const offset = (copy.getDay() + 6) % 7; // Monday = 0
    copy.setDate(copy.getDate() - offset);
    return copy;
  }

  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function sumMinutes(list) {
    return list.reduce((total, s) => total + s.durationSeconds / 60, 0);
  }

  function percentChange(current, previous) {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  // Streak of consecutive days with at least one workout.
  function currentStreak(daySet) {
    const cursor = startOfDay(new Date());
    if (!daySet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    while (daySet.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateNumber(el, target) {
    if (!el) return;
    if (reduceMotion) {
      el.textContent = target.toLocaleString();
      return;
    }

    const start = performance.now();
    const duration = 900;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function renderTrend(el, change) {
    if (!el) return;
    el.classList.remove('trend-down');

    if (change === null) {
      el.textContent = '—';
      return;
    }

    if (change < 0) {
      el.classList.add('trend-down');
      el.textContent = `↓ ${Math.abs(change)}%`;
    } else {
      el.textContent = `↑ ${change}%`;
    }
  }

  function renderStreakDays(daySet) {
    const grid = document.getElementById('streak-days');
    if (!grid) return;

    grid.innerHTML = '';
    const weekStart = startOfWeek(new Date());
    const todayKey = dayKey(new Date());

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const key = dayKey(date);

      const item = document.createElement('div');
      item.className = 'day-item';

      const circle = document.createElement('div');
      circle.className = 'day-circle';

      if (daySet.has(key)) {
        circle.classList.add('done');
        circle.textContent = '✓';
      } else if (key === todayKey) {
        circle.textContent = '·';
      } else if (key < todayKey) {
        circle.classList.add('missed');
        circle.textContent = '✕';
      }

      const name = document.createElement('span');
      name.className = 'day-name';
      name.textContent = DAY_NAMES[date.getDay()];

      item.append(circle, name);
      grid.appendChild(item);
    }
  }

  function renderChart(sessions, range) {
    const chart = document.getElementById('activity-chart');
    if (!chart) return;

    const minutesByDay = new Map();
    sessions.forEach((s) => {
      const key = dayKey(new Date(s.finishedAt));
      minutesByDay.set(key, (minutesByDay.get(key) || 0) + s.durationSeconds / 60);
    });

    const days = [];
    for (let i = range - 1; i >= 0; i -= 1) {
      const date = startOfDay(new Date());
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    const values = days.map((d) => Math.round(minutesByDay.get(dayKey(d)) || 0));
    const max = Math.max(...values, 1);
    const labelEvery = Math.ceil(range / 7);

    chart.innerHTML = '';

    days.forEach((date, index) => {
      const isToday = index === days.length - 1;

      const group = document.createElement('div');
      group.className = 'chart-bar-group';

      const bar = document.createElement('div');
      bar.className = 'chart-bar' + (isToday ? ' active' : '');
      bar.title = `${values[index]} min`;
      bar.style.height = '0%';

      const height = values[index] ? Math.max(6, (values[index] / max) * 100) : 2;
      requestAnimationFrame(() => {
        bar.style.height = `${height}%`;
      });

      const label = document.createElement('span');
      label.className = 'chart-label' + (isToday ? ' active' : '');
      if (isToday) {
        label.textContent = 'Today';
      } else if (index % labelEvery === 0) {
        label.textContent = DAY_NAMES[date.getDay()];
      }

      group.append(bar, label);
      chart.appendChild(group);
    });

    return values.reduce((total, value) => total + value, 0);
  }

  function updateChart(range) {
    const totalMinutes = renderChart(store.read(), range) || 0;
    const summary = document.getElementById('activity-summary');
    if (summary) {
      summary.textContent = `${totalMinutes} min in the last ${range} days`;
    }
  }

  function renderRing(calories) {
    const ring = document.getElementById('ring-progress');
    if (!ring) return;

    const percent = Math.min(calories / WEEKLY_CALORIE_GOAL, 1) * 100;
    ring.style.strokeDasharray = '100';
    ring.style.strokeDashoffset = String(100 - percent);
  }

  function render() {
    const sessions = store.read();
    const now = new Date();

    const daySet = new Set(sessions.map((s) => dayKey(new Date(s.finishedAt))));

    const workoutEl = document.getElementById('stat-workouts');
    animateNumber(workoutEl, sessions.length);

    // Calories: current week vs previous week.
    const weekStart = startOfWeek(now);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const thisWeek = sessions.filter((s) => new Date(s.finishedAt) >= weekStart);
    const prevWeek = sessions.filter((s) => {
      const finished = new Date(s.finishedAt);
      return finished >= prevWeekStart && finished < weekStart;
    });

    const weekCalories = Math.round(sumMinutes(thisWeek) * CALORIES_PER_MIN);
    const prevWeekCalories = Math.round(sumMinutes(prevWeek) * CALORIES_PER_MIN);

    animateNumber(document.getElementById('stat-calories'), weekCalories);
    renderRing(weekCalories);
    renderTrend(
      document.getElementById('trend-calories'),
      percentChange(weekCalories, prevWeekCalories)
    );

    // Workouts: current month vs previous month.
    const monthOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    const thisMonthKey = monthOf(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = monthOf(lastMonthDate);

    const thisMonth = sessions.filter((s) => monthOf(new Date(s.finishedAt)) === thisMonthKey);
    const lastMonth = sessions.filter((s) => monthOf(new Date(s.finishedAt)) === lastMonthKey);

    renderTrend(
      document.getElementById('trend-workouts'),
      percentChange(thisMonth.length, lastMonth.length)
    );

    const streak = currentStreak(daySet);
    const streakEl = document.getElementById('streak-value');
    if (streakEl) {
      streakEl.textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
    }

    renderStreakDays(daySet);

    const rangeSelect = document.getElementById('chart-range');
    updateChart(Number(rangeSelect && rangeSelect.value) || 7);

    const empty = document.getElementById('progress-empty');
    if (empty) empty.hidden = sessions.length > 0;
  }

  const rangeSelect = document.getElementById('chart-range');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', () => {
      updateChart(Number(rangeSelect.value) || 7);
    });
  }

  // Keep the dashboard fresh if a workout finishes in another tab.
  window.addEventListener('storage', (event) => {
    if (event.key === store.key) render();
  });

  render();
})();
