# Valorant Color Reaction Test

A browser-based reaction time test that helps Valorant players determine which enemy highlight color: **Red**, **Yellow**, or **Purple**, gives them the fastest reaction time.

## Purpose

Valorant lets players choose a custom highlight color for enemy agents. Most players pick based on personal preference or visibility, but the color that *looks* best isn't necessarily the one you react to fastest. This tool measures your actual reaction time across all three options so you can make a data-driven choice.

## How It Works

1. A colored circle appears on a dark background at a random moment.
2. Click anywhere as fast as you can when you see it.
3. 30 trials total (10 per color), in randomized order.
4. After all trials, a results page shows your mean, median, and standard deviation per color, and identifies which color gave you the lowest median reaction time.

## Features

- **Millisecond-precision timing** via `performance.now()`
- **Low-latency input** using `pointerdown` instead of `click`
- **Accurate visibility timestamp** — `requestAnimationFrame` is used to record exactly when the target becomes visible, not just when JS schedules it
- **GPU-composited target** : target is pre-rendered and toggled via `opacity` + `will-change: opacity` to avoid layout reflow
- **False start detection** : clicking before the target appears cancels the trial and retries it
- **Anti-rhythm randomness** : delay before each target is random between 1.5–4 seconds
- **Per-color statistics** : mean, median, and standard deviation calculated for each color
- **Results chart** : Chart.js bar chart comparing mean and median reaction time per color
- **Session-scoped storage**  results are saved to `sessionStorage` (cleared when the tab closes)

## File Structure

```
index.html          Landing page with instructions and start button
test.html           Test screen (full-viewport click area)
results.html        Results page with stats table and chart
css/
  base.css          CSS variables, reset, shared button styles
  test.css          Test screen and results page layout
js/
  test-engine.js    Core timing logic, state machine, trial management
  results.js        Stats calculation and chart rendering
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no framework, no build step
- [Chart.js 4.4](https://www.chartjs.org/) via CDN for the results chart

## Running Locally

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

For best results, use a 1000hz+ gaming mouse and a monitor running at its native refresh rate.

## To-Do

- [ ] Improve response time
- [ ] Eyedrop the exact Enemy highlight color from the game and replace the current colors.
- [ ] Randomize target position within a bounded arena (prevent muscle-memory clicking).
- [ ] Per-trial timeline chart on results page (line chart showing RT across all 10 trials per color, reveals warm-up and fatigue effects).
- [ ] Personal best tracking via `localStorage` (track improvement!)
- [ ] Hit-quality feedback flash (color the screen green / yellow / red based on reaction speed thresholds)
- [ ] Humanoid silhouette target instead of a plain circle.
- [ ] False start rate shown in the results table.
