// Weight Trend chart: updates when the range dropdown changes.
// Replace the sample numbers below with real data (e.g. from your API) when available.
(function () {
    const chart = document.getElementById('weight-chart');
    const select = document.getElementById('weight-range');
    const summary = document.getElementById('weight-summary');
    if (!chart || !select) return;

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Labels for the last 12 months, ending with the current month
    function lastYearLabels() {
        const now = new Date();
        const labels = [];
        for (let i = 11; i >= 0; i--) {
            labels.push(MONTHS[new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth()]);
        }
        labels[labels.length - 1] = 'Now';
        return labels;
    }

    // Weight in kg
    const DATA = {
        '30d': {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Now'],
            values: [70.0, 70.4, 71.0, 71.5, 72.3]
        },
        '3m': {
            labels: ['Wk 2', 'Wk 4', 'Wk 6', 'Wk 8', 'Wk 10', 'Now'],
            values: [68.2, 69.0, 69.8, 70.6, 71.4, 72.3]
        },
        '1y': {
            labels: lastYearLabels(),
            values: [63.5, 64.2, 65.0, 65.6, 66.5, 67.1, 67.9, 68.8, 69.6, 70.5, 71.4, 72.3]
        }
    };

    function render(rangeKey) {
        const { labels, values } = DATA[rangeKey];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min || 1;

        chart.innerHTML = '';
        const bars = [];

        values.forEach((value, i) => {
            const isLast = i === values.length - 1;

            const group = document.createElement('div');
            group.className = 'chart-bar-group';

            const bar = document.createElement('div');
            bar.className = 'chart-bar' + (isLast ? ' active' : '');
            bar.textContent = value.toFixed(1);
            bar.title = value.toFixed(1) + ' kg';

            const label = document.createElement('span');
            label.className = 'chart-label' + (isLast ? ' active' : '');
            label.textContent = labels[i];

            group.appendChild(bar);
            group.appendChild(label);
            chart.appendChild(group);

            // scale bar between 30% and 85% of the chart height
            bars.push({ bar, height: 30 + ((value - min) / span) * 55 });
        });

        // set heights on the next frame so the CSS transition animates
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bars.forEach(({ bar, height }) => { bar.style.height = height + '%'; });
            });
        });

        const diff = values[values.length - 1] - values[0];
        const cls = diff >= 0 ? 'trend-up' : 'trend-down';
        const arrow = diff >= 0 ? '⬆' : '⬇';
        summary.innerHTML =
            '<span class="' + cls + '">' + arrow + ' ' + Math.abs(diff).toFixed(1) + ' kg</span> ' +
            '<span class="trend-text">over this period</span>';
    }

    select.addEventListener('change', () => render(select.value));
    render(select.value);
})();
