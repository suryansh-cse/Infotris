/**
 * HERO JOURNEY — Learn → Solve → Build → Ship interactive visualization
 * Scroll-aware stage activation with smooth transitions
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const journeyVisual = document.querySelector('.journey-visual');
  const stages = document.querySelectorAll('.journey-stage');
  const nodes = document.querySelectorAll('.journey-node');

  if (!journeyVisual || !stages.length) return;

  /**
   * Update visual progress based on active stage
   */
  function updateProgress(activeStage) {
    journeyVisual.dataset.progress = activeStage;

    // Update SVG nodes
    nodes.forEach((node, index) => {
      const stageNum = index + 1;
      node.classList.toggle('is-active', stageNum === activeStage);
      node.classList.toggle('is-complete', stageNum < activeStage);
    });
  }

  /**
   * Activate a specific stage
   */
  function activateStage(stageNum) {
    stages.forEach((stage, index) => {
      const num = index + 1;
      stage.classList.toggle('is-active', num === stageNum);
      stage.classList.toggle('is-complete', num < stageNum);
    });

    updateProgress(stageNum);
  }

  /**
   * Continuous scroll-aware activation — feels like progressing through a journey.
   * Uses both IntersectionObserver (for discrete stage entry) and a lightweight
   * scroll progress calculation on the hero section for smooth path drawing.
   */
  function initScrollActivation() {
    if (prefersReducedMotion) {
      stages.forEach(stage => stage.classList.add('is-complete'));
      activateStage(4);
      return;
    }

    const heroSection = document.querySelector('.hero-section');
    let ticking = false;
    let lastStage = 1;

    // Discrete observer keeps keyboard/hover fallback precise
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stageNum = parseInt(entry.target.dataset.stage, 10);
          if (!ticking) {
            lastStage = stageNum;
            activateStage(stageNum);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -55% 0px',
      threshold: 0.15
    });
    stages.forEach(stage => observer.observe(stage));

    // Continuous progress based on hero scroll — subtle parallax-like trail draw
    function onScroll() {
      if (!heroSection || journeyVisual.matches(':hover')) {
        ticking = false;
        return;
      }
      const rect = heroSection.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 = hero fully in view, 1 = hero scrolled past
      const progress = Math.min(Math.max((vh * 0.2 - rect.top) / (rect.height * 0.65), 0), 1);
      const stage = Math.min(4, Math.max(1, Math.ceil(progress * 4) || 1));
      if (stage !== lastStage) {
        lastStage = stage;
        activateStage(stage);
      }
      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }

    // Only bind if frequently scrolling on desktop — passive & cheap
    let scrollBound = false;
    const enableScroll = () => {
      if (!scrollBound && window.innerWidth > 768) {
        window.addEventListener('scroll', requestTick, { passive: true });
        scrollBound = true;
      }
    };
    const disableScroll = () => {
      if (scrollBound && window.innerWidth <= 768) {
        window.removeEventListener('scroll', requestTick);
        scrollBound = false;
      }
    };
    enableScroll();
    window.addEventListener('resize', () => { enableScroll(); disableScroll(); });
  }

  /**
   * Hover interaction - preview stage on hover (with gentle rAF, not jumpy)
   */
  function initHoverInteraction() {
    if (prefersReducedMotion) return;

    let hoverTimeout = null;

    stages.forEach((stage, index) => {
      const stageNum = index + 1;
      stage.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        activateStage(stageNum);
        // subtle icon micro-rotation for personality
        const icon = stage.querySelector('.journey-stage-icon');
        if (icon) {
          icon.style.transition = 'transform 0.3s var(--ease-premium)';
          icon.style.transform = 'translateY(-2px) scale(1.08)';
        }
      });
      stage.addEventListener('mouseleave', () => {
        const icon = stage.querySelector('.journey-stage-icon');
        if (icon) icon.style.transform = '';
        hoverTimeout = setTimeout(() => {
          const viewportCenter = window.innerHeight / 2;
          let closestStage = 1;
          let minDistance = Infinity;
          stages.forEach((s, i) => {
            const rect = s.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const distance = Math.abs(center - viewportCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestStage = i + 1;
            }
          });
          activateStage(closestStage);
        }, 320);
      });
    });

    // auto-cycle gently when in viewport and not hovered (very slow, not distracting)
    let cycleTimer = null;
    const visualObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !prefersReducedMotion) {
          let idx = 1;
          cycleTimer = setInterval(() => {
            if (journeyVisual.matches(':hover') || document.hidden) return;
            // only cycle if user hasn't manually interacted recently
            if (Date.now() - lastUserInteraction < 8000) return;
            idx = (idx % 4) + 1;
            activateStage(idx);
          }, 3800);
        } else {
          clearInterval(cycleTimer);
        }
      });
    }, { threshold: 0.35 });
    visualObserver.observe(journeyVisual);

    let lastUserInteraction = 0;
    stages.forEach(s => s.addEventListener('mouseenter', () => { lastUserInteraction = Date.now(); }));
    journeyVisual.addEventListener('mouseenter', () => { lastUserInteraction = Date.now(); });
  }

  /**
   * Keyboard navigation for stages
   */
  function initKeyboardNav() {
    stages.forEach((stage, index) => {
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('role', 'button');
      stage.setAttribute('aria-label', `Stage ${index + 1}: ${stage.querySelector('.journey-stage-title')?.textContent}`);

      stage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateStage(index + 1);
          stage.focus();
        } else if (e.key === 'ArrowRight' && index < stages.length - 1) {
          e.preventDefault();
          stages[index + 1].focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          stages[index - 1].focus();
        }
      });
    });
  }

  /**
   * Initialize all journey interactions
   */
  function init() {
    initScrollActivation();
    initHoverInteraction();
    initKeyboardNav();

    // Initial state - first stage active
    activateStage(1);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();