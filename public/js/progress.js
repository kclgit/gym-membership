// Weight Trend chart: draws the real weight log for the selected range.
(function () {
    const store = window.GymTrackWeights;
    const chart = document.getElementById('weight-chart');
    const select = document.getElementById('weight-range');
    const summary = document.getElementById('weight-summary');
    if (!store || !chart || !select) return;

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const RANGE_DAYS = { '30d': 30, '3m': 90, '1y': 365 };
    const MAX_BARS = 12;

    // ?demo=1 fills the chart with sample entries for a quick preview.
    if (new URLSearchParams(location.search).get('demo') === '1') {
        store.seedDemo();
    }

    function shortDate(date) {
        return date.getDate() + ' ' + MONTHS[date.getMonth()];
    }

    function entriesInRange(days) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        return store.read()
            .filter((entry) => new Date(entry.loggedAt).getTime() >= cutoff)
            .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
    }

    // Keep the latest entry per day so the chart has one bar per day.
    function daily(entries) {
        const byDay = new Map();

        entries.forEach((entry) => {
            const date = new Date(entry.loggedAt);
            const key = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            byDay.set(key, entry);
        });

        return Array.from(byDay.values());
    }

    // Keep at most MAX_BARS points, evenly spaced, so labels stay readable.
    function thin(entries) {
        if (entries.length <= MAX_BARS) return entries;

        const step = (entries.length - 1) / (MAX_BARS - 1);
        const picked = [];
        for (let i = 0; i < MAX_BARS; i += 1) {
            picked.push(entries[Math.round(i * step)]);
        }
        return picked;
    }

    function render() {
        const days = RANGE_DAYS[select.value] || 30;
        const entries = thin(daily(entriesInRange(days)));

        chart.innerHTML = '';

        if (!entries.length) {
            const empty = document.createElement('p');
            empty.className = 'chart-empty';
            empty.textContent = 'No weight logged in this period yet.';
            chart.appendChild(empty);
            summary.innerHTML = '';
            return;
        }

        const values = entries.map((entry) => entry.kg);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min || 1;
        const bars = [];

        entries.forEach((entry, i) => {
            const isLast = i === entries.length - 1;
            const date = new Date(entry.loggedAt);

            const group = document.createElement('div');
            group.className = 'chart-bar-group';

            const bar = document.createElement('div');
            bar.className = 'chart-bar' + (isLast ? ' active' : '');
            bar.textContent = entry.kg.toFixed(1);
            bar.title = entry.kg.toFixed(1) + ' kg on ' + shortDate(date);

            const label = document.createElement('span');
            label.className = 'chart-label' + (isLast ? ' active' : '');
            label.textContent = isLast ? 'Now' : shortDate(date);

            group.appendChild(bar);
            group.appendChild(label);
            chart.appendChild(group);

            // scale bar between 30% and 85% of the chart height
            const height = values.length === 1 ? 55 : 30 + ((entry.kg - min) / span) * 55;
            bars.push({ bar, height });
        });

        // set heights on the next frame so the CSS transition animates
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bars.forEach(({ bar, height }) => { bar.style.height = height + '%'; });
            });
        });

        if (values.length === 1) {
            summary.innerHTML = '<span class="trend-text">First entry: ' + values[0].toFixed(1) + ' kg</span>';
            return;
        }

        const diff = values[values.length - 1] - values[0];
        const cls = diff >= 0 ? 'trend-up' : 'trend-down';
        const arrow = diff >= 0 ? '⬆' : '⬇';
        summary.innerHTML =
            '<span class="' + cls + '">' + arrow + ' ' + Math.abs(diff).toFixed(1) + ' kg</span> ' +
            '<span class="trend-text">over this period</span>';
    }

    // Log a new weight from the input next to the chart.
    const form = document.getElementById('weight-form');
    const input = document.getElementById('weight-input');
    if (form && input) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const kg = Number(input.value);
            if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
                if (typeof showToast === 'function') {
                    showToast('Enter a weight between 20 and 400 kg.', 'error');
                }
                input.focus();
                return;
            }

            store.saveWeight(kg);
            input.value = '';
            render();

            if (typeof showToast === 'function') showToast('Weight logged');
        });
    }

    select.addEventListener('change', render);
    render();

    // Keep the chart in sync if another tab logs a weight.
    window.addEventListener('storage', (event) => {
        if (event.key === store.key) render();
    });
})();

// Routine cards: click a card to see its workouts
(function () {
    const ROUTINES = {
        'full-body': {
            title: 'Full body hit',
            meta: '30 min · 320 Cal · High intensity',
            workouts: [
                ['Jumping Jacks', '45 sec'],
                ['Burpees', '40 sec'],
                ['Squat Jumps', '40 sec'],
                ['Mountain Climbers', '45 sec'],
                ['Push-ups', '3 x 12'],
                ['Kettlebell Swings', '3 x 15'],
                ['High Knees', '45 sec'],
                ['Plank to Down Dog', '3 x 10']
            ]
        },
        'strength-power': {
            title: 'Strength and Power',
            meta: '30 - 45 min · 450 Cal · Compound lifts',
            workouts: [
                ['Barbell Back Squat', '4 x 6'],
                ['Deadlift', '4 x 5'],
                ['Bench Press', '4 x 8'],
                ['Overhead Press', '3 x 8'],
                ['Barbell Row', '3 x 10'],
                ['Pull-ups', '3 x 8']
            ]
        },
        'core': {
            title: 'Core workouts',
            meta: '20 - 25 min · 220 Cal · Abs and stability',
            workouts: [
                ['Plank', '3 x 45 sec'],
                ['Bicycle Crunches', '3 x 20'],
                ['Russian Twists', '3 x 20'],
                ['Leg Raises', '3 x 12'],
                ['Dead Bug', '3 x 12'],
                ['Side Plank', '2 x 30 sec each']
            ]
        }
    };

    const modal = document.getElementById('routine-modal');
    const titleEl = document.getElementById('routine-modal-title');
    const metaEl = document.getElementById('routine-modal-meta');
    const listEl = document.getElementById('routine-modal-list');
    const closeBtn = document.getElementById('routine-modal-close');
    if (!modal) return;

    let lastFocused = null;

    function openModal(key) {
        const routine = ROUTINES[key];
        if (!routine) return;
        titleEl.textContent = routine.title;
        metaEl.textContent = routine.meta;
        listEl.innerHTML = '';
        routine.workouts.forEach(([name, detail]) => {
            const li = document.createElement('li');
            const n = document.createElement('span');
            n.className = 'workout-name';
            n.textContent = name;
            const d = document.createElement('span');
            d.className = 'workout-detail';
            d.textContent = detail;
            li.appendChild(n);
            li.appendChild(d);
            listEl.appendChild(li);
        });
        lastFocused = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.routine-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.routine));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card.dataset.routine);
            }
        });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
})();
