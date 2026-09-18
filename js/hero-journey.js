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
   * IntersectionObserver to activate stages on scroll
   */
  function initScrollActivation() {
    if (prefersReducedMotion) {
      // Show all stages immediately
      stages.forEach(stage => stage.classList.add('is-complete'));
      activateStage(4);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stageNum = parseInt(entry.target.dataset.stage, 10);
          activateStage(stageNum);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -60% 0px',
      threshold: 0.15
    });

    stages.forEach(stage => observer.observe(stage));
  }

  /**
   * Hover interaction - preview stage on hover
   */
  function initHoverInteraction() {
    if (prefersReducedMotion) return;

    let hoverTimeout = null;
    let currentActive = 1;

    stages.forEach((stage, index) => {
      const stageNum = index + 1;

      stage.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        currentActive = stageNum;
        activateStage(stageNum);
      });

      stage.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
          // Re-evaluate based on scroll position
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

          currentActive = closestStage;
          activateStage(closestStage);
        }, 300);
      });
    });
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