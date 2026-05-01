'use strict';

const COLORS = [
  { id: 'red',    name: 'Red',    hex: '#FF4655' },
  { id: 'yellow', name: 'Yellow', hex: '#FFD700' },
  { id: 'purple', name: 'Purple', hex: '#9B59B6' },
];

const TRIALS_PER_COLOR     = 10;
const DELAY_MIN_MS         = 1500;
const DELAY_MAX_MS         = 4000;
const IDLE_PAUSE_MS        = 500;
const FEEDBACK_DURATION_MS = 700;
const FALSE_START_PAUSE_MS = 1400;

let trials        = [];
let currentIndex  = 0;
let state         = 'ready';
let targetShownAt = null;
let waitTimeout   = null;
let results       = [];

const testArea      = document.getElementById('test-area');
const targetEl      = document.getElementById('target');
const trialCounter  = document.getElementById('trial-counter');
const statusMsg     = document.getElementById('status-msg');
const feedbackFlash = document.getElementById('feedback-flash');
const resetBtn      = document.getElementById('reset-btn');
const progressBar   = document.getElementById('progress-bar');

const TOTAL_TRIALS  = COLORS.length * TRIALS_PER_COLOR;

function updateProgress() {
  progressBar.style.width = `${(currentIndex / TOTAL_TRIALS) * 100}%`;
}

function buildTrialList() {
  const list = [];
  for (const color of COLORS) {
    for (let i = 0; i < TRIALS_PER_COLOR; i++) list.push(color);
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function startTrial() {
  updateProgress();
  const color = trials[currentIndex];
  state = 'idle';

  trialCounter.textContent       = `Trial ${currentIndex + 1} / ${trials.length}`;
  targetEl.style.color = color.hex;
  hideTarget();
  statusMsg.textContent = '';

  waitTimeout = setTimeout(enterWaiting, IDLE_PAUSE_MS);
}

function enterWaiting() {
  state = 'waiting';
  statusMsg.textContent = 'Wait for it…';

  const delay = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  waitTimeout = setTimeout(showTargetViaRAF, delay);
}

function showTargetViaRAF() {
  requestAnimationFrame(() => {
    showTarget();
    targetShownAt = performance.now();
    state = 'active';
    statusMsg.textContent = 'Click!';
  });
}

function showTarget() {
  targetEl.classList.add('visible');
}

function hideTarget() {
  targetEl.classList.remove('visible');
}

testArea.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;

  if (state === 'ready') {
    state = 'idle';
    startTrial();
    return;
  }

  if (state === 'waiting') {
    handleFalseStart();
    return;
  }

  if (state === 'active') {
    const reactionTime = performance.now() - targetShownAt;
    handleValidClick(reactionTime);
  }
});

function handleFalseStart() {
  clearTimeout(waitTimeout);
  hideTarget();
  state = 'feedback';

  showFeedback('TOO EARLY', 'false-start');

  setTimeout(() => {
    hideFeedback();
    startTrial();
  }, FALSE_START_PAUSE_MS);
}

function handleValidClick(reactionTime) {
  state = 'feedback';
  hideTarget();

  const color = trials[currentIndex];
  results.push({ colorId: color.id, reactionTime: Math.round(reactionTime) });

  showFeedback(`${Math.round(reactionTime)} ms`, 'good-click');

  setTimeout(() => {
    hideFeedback();
    currentIndex++;

    if (currentIndex >= trials.length) {
      finishTest();
    } else {
      startTrial();
    }
  }, FEEDBACK_DURATION_MS);
}

function showFeedback(text, cssClass) {
  feedbackFlash.textContent = text;
  feedbackFlash.className   = `show ${cssClass}`;
}

function hideFeedback() {
  feedbackFlash.className   = '';
  feedbackFlash.textContent = '';
}

function savePBIfBetter(results) {
  const grouped = {};
  for (const { colorId, reactionTime } of results) {
    if (!grouped[colorId]) grouped[colorId] = [];
    grouped[colorId].push(reactionTime);
  }

  function localMedian(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
  }

  const bestMedian = Math.min(...Object.values(grouped).map(localMedian));
  const stored = localStorage.getItem('pbMedian');
  const prev   = stored !== null ? parseFloat(stored) : null;

  localStorage.setItem('pbMedian', bestMedian);
  localStorage.setItem('pbIsNew', prev === null || bestMedian < prev ? 'true' : 'false');
  if (prev !== null) {
    localStorage.setItem('pbPrev', prev);
  } else {
    localStorage.removeItem('pbPrev');
  }
}

function finishTest() {
  updateProgress();
  statusMsg.textContent = 'Done! Loading results…';
  savePBIfBetter(results);
  sessionStorage.setItem('reactionResults', JSON.stringify(results));
  window.location.href = 'results.html';
}

function resetTest() {
  clearTimeout(waitTimeout);
  hideTarget();
  hideFeedback();

  trials       = buildTrialList();
  currentIndex = 0;
  results      = [];
  updateProgress();
  state        = 'ready';

  trialCounter.textContent = `${trials.length} Trials`;
  colorLabel.textContent   = '';
  colorLabel.style.color   = '';
  statusMsg.textContent    = 'Click anywhere to begin';
}

resetBtn.addEventListener('click', resetTest);

trials = buildTrialList();
