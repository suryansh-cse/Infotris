/**
 * ANIME.JS — Pillar card layout loop
 *
 * WHY THE ORIGINAL CODE FAILED:
 * 1. CSS selectors used "#layout" but HTML had no id="layout" → grid never applied.
 * 2. anime.js was loaded TWICE (in <head> and before </body>) → double init / race.
 * 3. No card/container sizing in CSS → nothing visible to animate.
 * 4. Script ran before DOM was guaranteed ready (head load) without checks.
 * 5. Opening index.html via file:// can block ES module CDN imports — use a local
 *    server (Live Server, `npx serve`, etc.) so modules load over http/https.
 *
 * HOW THIS WORKS:
 * - createLayout() watches ".layout-container" and records each card's position/size.
 * - layout.update() changes data-grid (1→2→3→4→1…), which swaps CSS grid rules.
 * - anime.js smoothly animates each card from old positions to new ones.
 * - onComplete + setTimeout restarts the loop for continuous motion.
 */

import { createLayout, stagger } from 'animejs';

/** Pause between layout morphs (ms) — keeps the loop calm and readable */
const PAUSE_BETWEEN_LAYOUTS = 700;

/** Counter cycles data-grid through 1, 2, 3, 4 */
let gridIndex = 1;

/**
 * Starts the infinite layout animation loop.
 * Called once after the DOM and CSS are ready.
 */
function startPillarAnimation() {
  const container = document.querySelector('.layout-container');

  if (!container) {
    console.error(
      '[Infotris anime.js] .layout-container not found. Check index.html markup.'
    );
    return;
  }

  // Bind anime.js layout engine to the grid container
  const layout = createLayout('.layout-container');

  function animateNextLayout() {
    layout.update(
      ({ root }) => {
        // Advance grid state: 1 → 2 → 3 → 4 → 1 …
        gridIndex = (gridIndex % 4) + 1;
        root.dataset.grid = String(gridIndex);
      },
      {
        duration: 900,
        delay: stagger(120),
        ease: 'out(3)',
        onComplete: () => {
          setTimeout(animateNextLayout, PAUSE_BETWEEN_LAYOUTS);
        },
      }
    );
  }

  // Small delay so the browser paints grid state "1" before the first morph
  setTimeout(animateNextLayout, 800);
}

// Wait until HTML is parsed so .layout-container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPillarAnimation);
} else {
  startPillarAnimation();
}


import { animate, utils } from 'https://esm.sh/animejs';
console.log("anime.js loaded");
animate('.square', {
  x: $el => $el.getAttribute('data-x'),
  y: (_, i) => 50 + (-50 * i),
  scale: (_, i, t) => (t.length - i) * 0.75,
  rotate: () => utils.random(-360, 360),
  borderRadius: () => `+=${utils.random(0, 8)}`,
  duration: () => utils.random(1200, 1800),
  delay: () => utils.random(0, 400),
  ease: 'outElastic(1, .5)',

  loop: true,
  alternate: true
});
 