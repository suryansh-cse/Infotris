/**
 * PHILOSOPHY — Small discoveries, not billboards.
 * Randomly places 1–2 tiny philosophy notes per page from a curated pool.
 * Respects prefers-reduced-motion (still shows content, no animation).
 * No repetition per session; sessionStorage remembers what was shown.
 */
(function () {
  'use strict';

  const POOL = [
    "Knowledge is everywhere. Direction is not.",
    "Don't just learn it. Build it.",
    "Understanding beats memorizing.",
    "Your solution doesn't have to look like ours.",
    "We care about how you think, not just what you type.",
    "Tutorial hell ends where structured learning begins.",
    "Small steps, consistent trail.",
    "Progress over perfection.",
    "Learn → Solve → Build → Ship.",
    "Stuck? That's where learning lives.",
    "The best time to start was yesterday. The next best is now.",
    "Build something you can show your future self."
  ];

  const EXISTING_KEY = 'infotris-philosophy-seen';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pick(count) {
    try {
      const seen = JSON.parse(sessionStorage.getItem(EXISTING_KEY) || '[]');
      const available = POOL.filter(s => !seen.includes(s));
      const src = available.length >= count ? available : POOL;
      // shuffle
      const shuffled = src.slice().sort(() => 0.5 - Math.random());
      const chosen = shuffled.slice(0, count);
      sessionStorage.setItem(EXISTING_KEY, JSON.stringify([...seen, ...chosen].slice(-8)));
      return chosen;
    } catch (e) {
      return POOL.slice(0, count);
    }
  }

  function createWhisper(text, dark) {
    const el = document.createElement('p');
    el.className = 'philosophy-whisper' + (dark ? ' philosophy-whisper--dark' : '');
    el.setAttribute('role', 'note');
    el.setAttribute('aria-label', 'Infotris thought');
    // lightly emphasize a keyword if present
    const withEmphasis = text.replace(/Direction|Build|Understanding|Tutorial hell|Learn/, m => `<strong>${m}</strong>`);
    el.innerHTML = withEmphasis;
    return el;
  }

  function inject() {
    // Choose targets that exist — be conservative, 1–2 max per page
    const targets = [];

    // After hero on every page except dashboard
    const hero = document.querySelector('.hero-section, .about-hero, .careers-hero, .courses-page-header, .dashboard-welcome');
    if (hero && !document.body.classList.contains('dashboard-page')) {
      targets.push({ after: hero, dark: false, slot: 'after-hero' });
    }

    // Between major sections (pick one random section)
    const sections = Array.from(document.querySelectorAll('main > section'));
    if (sections.length >= 3) {
      const mid = sections[Math.floor(sections.length / 2)];
      if (mid && !mid.querySelector('.philosophy-whisper')) {
        targets.push({ after: mid, dark: mid.classList.contains('careers-section--dark') || mid.classList.contains('showcase-section'), slot: 'mid' });
      }
    }

    // Dashboard sidebar empty state helpers — subtle label near progress
    const goalGauge = document.querySelector('.goal-gauge-container');
    if (goalGauge && !goalGauge.nextElementSibling?.classList?.contains('philosophy-progress-label')) {
      const label = document.createElement('p');
      label.className = 'philosophy-progress-label';
      label.textContent = pick(1)[0];
      goalGauge.insertAdjacentElement('afterend', label);
      // already used pick, avoid double-pick
      if (targets.length) targets.pop();
      return; // dashboard gets its own treatment
    }

    // Course cards — add a hover hint to ONE random card only (discovery on hover)
    const cards = Array.from(document.querySelectorAll('.course-card, .careers-path-card'));
    if (cards.length) {
      const card = cards[Math.floor(Math.random() * Math.min(cards.length, 4))];
      if (card && !card.querySelector('.philosophy-hover-hint')) {
        const hint = document.createElement('span');
        hint.className = 'philosophy-hover-hint';
        const hints = ["Your path, your pace.", "Understanding > memorizing.", "Build to remember."];
        hint.textContent = hints[Math.floor(Math.random() * hints.length)];
        card.style.position = 'relative';
        card.appendChild(hint);
      }
    }

    // Now inject whispers for remaining targets (max 1 more)
    if (targets.length === 0) return;
    const chosenTexts = pick(1);
    const t = targets[0];
    const whisper = createWhisper(chosenTexts[0], t.dark);
    whisper.classList.add('scroll-reveal');
    // stagger slightly so reveal feels intentional
    whisper.style.transitionDelay = '0.08s';
    t.after.insertAdjacentElement('afterend', whisper);
    // trigger reveal via existing observer if available, else visible
    if (window.ScrollAnimations && window.ScrollAnimations.initScrollReveal) {
      // re-observe
      setTimeout(() => {
        if (!prefersReduced) whisper.classList.add('is-visible');
      }, 120);
    }
    // also handle empty states: if heatmap is empty, inject empty poetry (dashboard handles via html)
    const heatmap = document.getElementById('heatmapGrid');
    if (heatmap && heatmap.children.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'philosophy-empty';
      empty.innerHTML = '<em>Consistency compounds.</em><small>One small commit a day keeps tutorial hell away.</small>';
      heatmap.insertAdjacentElement('afterend', empty);
    }
  }

  // Footer rotating quote (on pages with footer-quote-section)
  function rotateFooterQuote() {
    const el = document.querySelector('.footer-quote-section, .philosophy-rotate');
    if (!el) return;
    const quotes = [
      "Learn. Build. Grow.",
      "Direction beats distraction.",
      "Build what you wish existed.",
      "Understanding > memorizing."
    ];
    let idx = 0;
    setInterval(() => {
      if (document.hidden || prefersReduced) return;
      idx = (idx + 1) % quotes.length;
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = quotes[idx];
        el.style.opacity = '1';
      }, 420);
    }, 5200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { inject(); rotateFooterQuote(); });
  } else {
    inject(); rotateFooterQuote();
  }
})();
