// Body weight log stored in localStorage.
// progress.html reads it for the Weight Trend chart.
(function () {
  const KEY = 'gymtrack:weights';
  const MAX_ENTRIES = 500;

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
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
    } catch (err) {
      // Storage unavailable or full; entries just won't persist.
    }
  }

  function saveWeight(kg) {
    const value = Math.round(Number(kg) * 10) / 10;
    if (!Number.isFinite(value) || value <= 0) return null;

    const entry = {
      id: Date.now(),
      kg: value,
      loggedAt: new Date().toISOString()
    };

    write(read().concat(entry));
    return entry;
  }

  function clear() {
    write([]);
  }

  // Sample history for previewing the chart (progress.html?demo=1).
  function seedDemo() {
    const weeks = [78.4, 78.0, 77.6, 77.9, 77.1, 76.6, 76.8, 76.1, 75.7, 75.4, 74.9, 74.6];

    const list = weeks.map((kg, i) => {
      const date = new Date();
      date.setHours(8, 0, 0, 0);
      date.setDate(date.getDate() - (weeks.length - 1 - i) * 7);

      return {
        id: date.getTime() + i,
        kg,
        loggedAt: date.toISOString()
      };
    });

    write(list);
    return list;
  }

  window.GymTrackWeights = { key: KEY, read, saveWeight, clear, seedDemo };
})();
