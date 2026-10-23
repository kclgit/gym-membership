// Completed workout history stored in localStorage.
// workout.html writes here; progress.html reads from it.
(function () {
  const KEY = 'gymtrack:sessions';
  const MAX_SESSIONS = 300;

  // ?demo=1 swaps in sample data for this page load without touching storage.
  let demoList = null;

  function read() {
    if (demoList) return demoList.slice();

    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function write(list) {
    if (demoList) {
      demoList = list.slice(-MAX_SESSIONS);
      return;
    }

    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_SESSIONS)));
    } catch (err) {
      // Storage unavailable or full; history just won't persist.
    }
  }

  function saveSession(data) {
    const session = {
      id: Date.now(),
      name: String((data && data.name) || 'Workout'),
      durationSeconds: Math.max(0, Math.round((data && data.durationSeconds) || 0)),
      finishedAt: new Date().toISOString()
    };

    write(read().concat(session));
    return session;
  }

  function clear() {
    write([]);
  }

  function remove(id) {
    const list = read();
    const remaining = list.filter((session) => String(session.id) !== String(id));

    if (remaining.length === list.length) return false;

    write(remaining);
    return true;
  }

  // Sample history for previewing the dashboard (progress.html?demo=1).
  function seedDemo() {
    const names = [
      'Leg Day', 'Upper Body Push', 'HIIT Burn', 'Yoga Flow',
      'Cardio Run', 'Full Body', 'Pull Day'
    ];
    const daysAgo = [0, 1, 2, 3, 6, 7, 8, 10, 11, 13, 14, 15, 17, 18, 20, 21, 23, 24];

    const list = daysAgo.map((offset, i) => {
      const date = new Date();
      date.setHours(18, 30, 0, 0);
      date.setDate(date.getDate() - offset);

      return {
        id: date.getTime() + i,
        name: names[i % names.length],
        durationSeconds: (25 + ((i * 7) % 40)) * 60,
        finishedAt: date.toISOString()
      };
    }).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));

    demoList = list;
    return list;
  }

  window.GymTrackSessions = { key: KEY, read, saveSession, remove, clear, seedDemo };
})();
