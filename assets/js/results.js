'use strict';

const COLOR_META = {
  red:    { name: 'Red',    hex: '#FF4655' },
  yellow: { name: 'Yellow', hex: '#FFD700' },
  purple: { name: 'Purple', hex: '#9B59B6' },
};

function loadResults() {
  const raw = sessionStorage.getItem('reactionResults');
  if (!raw) {
    window.location.href = '../index.html';
    return [];
  }
  return JSON.parse(raw);
}

function meanExact(arr) {
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return Math.round(meanExact(arr) * 10) / 10;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  return Math.round(value * 10) / 10;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = meanExact(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function computeStats(results) {
  const grouped = Object.fromEntries(
    Object.keys(COLOR_META).map(id => [id, { times: [] }])
  );

  for (const { colorId, reactionTime } of results) {
    if (grouped[colorId]) grouped[colorId].times.push(reactionTime);
  }

  for (const [, bucket] of Object.entries(grouped)) {
    bucket.mean   = mean(bucket.times);
    bucket.median = median(bucket.times);
    bucket.stdDev = stdDev(bucket.times);
  }

  return grouped;
}

const TIERS = [
  { label: 'RADIANT',  maxMs: 180,      color: '#FFD700' },
  { label: 'DIAMOND',  maxMs: 220,      color: '#88c0d0' },
  { label: 'PLATINUM', maxMs: 260,      color: '#4caf8e' },
  { label: 'GOLD',     maxMs: 300,      color: '#e5c36e' },
  { label: 'SILVER',   maxMs: 350,      color: '#aab8c2' },
  { label: 'BRONZE',   maxMs: 420,      color: '#cd7f32' },
  { label: 'IRON',     maxMs: Infinity, color: '#768079' },
];

function renderTier(medianMs) {
  const tier      = TIERS.find(t => medianMs < t.maxMs);
  const tierLabel = document.getElementById('tier-label');
  tierLabel.textContent  = tier.label;
  tierLabel.style.color  = tier.color;
}

function animateCountUp(el, targetValue, duration) {
  const start    = performance.now();
  const decimals = String(targetValue).includes('.') ? 1 : 0;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = progress * (2 - progress);
    el.textContent = (eased * targetValue).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function renderPersonalBest() {
  const isNew = localStorage.getItem('pbIsNew') === 'true';
  const prev  = localStorage.getItem('pbPrev');
  const pbEl  = document.getElementById('pb-info');
  if (!pbEl) return;

  if (isNew) {
    pbEl.innerHTML = `<span id="pb-badge">NEW BEST</span>`;
  } else if (prev !== null) {
    pbEl.innerHTML = `<span id="pb-prev">Previous best: <strong>${parseFloat(prev).toFixed(1)} ms</strong></span>`;
  }
}

function renderWinner(stats) {
  let bestId     = null;
  let bestMedian = Infinity;

  for (const [id, s] of Object.entries(stats)) {
    if (s.times.length > 0 && s.median < bestMedian) {
      bestMedian = s.median;
      bestId     = id;
    }
  }

  if (!bestId) return;

  const meta   = COLOR_META[bestId];
  const banner = document.getElementById('winner-banner');

  banner.style.borderLeftColor                       = meta.hex;
  document.getElementById('winner-ms').textContent   = `${bestMedian} ms`;
  document.getElementById('winner-ms').style.color   = meta.hex;
  document.getElementById('winner-name').textContent = `${meta.name} — lowest median reaction time`;
  renderTier(bestMedian);
}

function renderTable(stats) {
  const tbody      = document.getElementById('stats-body');
  const bestMedian = Math.min(...Object.values(stats).map(s => s.median));

  for (const [id, s] of Object.entries(stats)) {
    const meta = COLOR_META[id];
    const row  = document.createElement('tr');

    if (s.median === bestMedian && s.times.length > 0) {
      row.style.background = 'rgba(255,255,255,0.04)';
    }

    row.innerHTML = `
      <td>
        <span class="color-swatch" style="background:${meta.hex}"></span>
        ${meta.name}
      </td>
      <td class="stat-num">0</td>
      <td><strong class="stat-num">0</strong></td>
      <td class="stat-num">0</td>
      <td>${s.times.length}</td>
    `;

    tbody.appendChild(row);

    const nums = row.querySelectorAll('.stat-num');
    animateCountUp(nums[0], s.mean,   800);
    animateCountUp(nums[1], s.median, 800);
    animateCountUp(nums[2], s.stdDev, 800);
  }
}

function renderChart(stats) {
  const ids       = Object.keys(COLOR_META);
  const labels    = ids.map(id => COLOR_META[id].name);
  const means     = ids.map(id => stats[id].mean);
  const medians   = ids.map(id => stats[id].median);
  const hexColors = ids.map(id => COLOR_META[id].hex);

  const ctx = document.getElementById('rt-chart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Mean (ms)',
          data: means,
          backgroundColor: hexColors.map(c => c + '88'),
          borderColor:     hexColors,
          borderWidth: 2,
        },
        {
          label: 'Median (ms)',
          data: medians,
          backgroundColor: hexColors,
          borderColor:     hexColors,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#aaa', boxWidth: 14 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ms`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#aaa' },
          grid:  { color: '#2a2a30' },
        },
        y: {
          beginAtZero: false,
          ticks: { color: '#aaa', callback: v => `${v} ms` },
          grid:  { color: '#2a2a30' },
          title: { display: true, text: 'Reaction Time (ms)', color: '#666' },
        },
      },
    },
  });
}

(function main() {
  const results = loadResults();
  if (!results.length) return;

  const stats = computeStats(results);
  renderWinner(stats);
  renderTable(stats);
  renderChart(stats);
  renderPersonalBest();
})();
