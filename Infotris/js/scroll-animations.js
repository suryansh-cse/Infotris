/**
 * SCROLL ANIMATIONS — IntersectionObserver-based reveal system
 * Lightweight, performant, respects prefers-reduced-motion
 * Supports: fade, slide, scale, stagger, counters, parallax
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Default configuration
  const DEFAULT_CONFIG = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1,
    once: true
  };

  // Animation classes
  const REVEAL_CLASS = 'scroll-reveal';
  const VISIBLE_CLASS = 'is-visible';
  const STAGGER_CONTAINER = 'stagger-reveal';
  const STAGGER_ITEM = 'stagger-item';

  /**
   * Initialize scroll reveal for elements with .scroll-reveal class
   * @param {Object} options - IntersectionObserver options
   */
  function initScrollReveal(options = {}) {
    if (prefersReducedMotion) {
      document.querySelectorAll(`.${REVEAL_CLASS}`).forEach(el => {
        el.classList.add(VISIBLE_CLASS);
      });
      return;
    }

    const config = { ...DEFAULT_CONFIG, ...options };
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(VISIBLE_CLASS);
          if (config.once) {
            obs.unobserve(entry.target);
          }
        } else if (!config.once) {
          entry.target.classList.remove(VISIBLE_CLASS);
        }
      });
    }, config);

    document.querySelectorAll(`.${REVEAL_CLASS}`).forEach(el => observer.observe(el));

    return observer;
  }

  /**
   * Staggered reveal for child elements within a container
   * @param {string} containerSelector - Parent container selector
   * @param {string} childSelector - Child element selector
   * @param {Object} options - IntersectionObserver options
   */
  function initStaggeredReveal(containerSelector, childSelector, options = {}) {
    if (prefersReducedMotion) {
      document.querySelectorAll(`${containerSelector} ${childSelector}`).forEach(el => {
        el.classList.add(VISIBLE_CLASS);
      });
      return;
    }

    const config = { ...DEFAULT_CONFIG, ...options };
    const containers = document.querySelectorAll(containerSelector);

    containers.forEach(container => {
      const children = container.querySelectorAll(childSelector);
      if (!children.length) return;

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            children.forEach((child, index) => {
              child.style.transitionDelay = `${index * 60}ms`;
              child.classList.add(VISIBLE_CLASS);
            });
            if (config.once) {
              obs.unobserve(entry.target);
            }
          } else if (!config.once) {
            children.forEach(child => child.classList.remove(VISIBLE_CLASS));
          }
        });
      }, config);

      observer.observe(container);
    });
  }

  /**
   * Counter animation for statistics/numbers
   * @param {string} selector - Element selector with data-count attribute
   * @param {Object} options - IntersectionObserver options
   */
  function initCounterAnimation(selector, options = {}) {
    if (prefersReducedMotion) {
      document.querySelectorAll(selector).forEach(el => {
        const target = parseInt(el.dataset.count || el.textContent, 10);
        el.textContent = target.toLocaleString();
      });
      return;
    }

    const config = { ...DEFAULT_CONFIG, threshold: 0.5, ...options };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count || el.textContent, 10);
          const duration = parseInt(el.dataset.duration || '1200', 10);
          const startTime = performance.now();
          const isDecimal = el.dataset.count && el.dataset.count.includes('.');
          const decimals = isDecimal ? (el.dataset.count.split('.')[1]?.length || 0) : 0;

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            
            if (decimals > 0) {
              el.textContent = current.toFixed(decimals);
            } else {
              el.textContent = Math.floor(current).toLocaleString();
            }

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              if (decimals > 0) {
                el.textContent = target.toFixed(decimals);
              } else {
                el.textContent = target.toLocaleString();
              }
            }
          }

          requestAnimationFrame(updateCounter);

          if (config.once) {
            obs.unobserve(el);
          }
        }
      });
    }, config);

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
  }

  /**
   * Parallax effect for background elements
   * @param {string} selector - Element selector
   * @param {number} strength - Parallax strength (0-1)
   */
  function initParallax(selector, strength = 0.2) {
    if (prefersReducedMotion) return;

    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallaxSpeed) || strength;
        const offset = (rect.top - window.innerHeight) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax(); // Initial calculation

    return () => window.removeEventListener('scroll', onScroll);
  }

  /**
   * Progress bar animation on scroll
   * @param {string} selector - Progress bar selector (expects data-progress attribute)
   */
  function initProgressAnimation(selector, options = {}) {
    if (prefersReducedMotion) {
      document.querySelectorAll(selector).forEach(el => {
        const progress = el.dataset.progress || '100';
        el.style.width = `${progress}%`;
        if (el.dataset.animate !== 'false') {
          el.style.transition = 'width 1s var(--ease-premium)';
        }
      });
      return;
    }

    const config = { ...DEFAULT_CONFIG, threshold: 0.3, ...options };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const progress = el.dataset.progress || '100';
          el.style.width = `${progress}%`;
          if (config.once) {
            obs.unobserve(el);
          }
        } else if (!config.once) {
          entry.target.style.width = '0%';
        }
      });
    }, config);

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
  }

  /**
   * Text reveal animation (character/word by word)
   * @param {string} selector - Text element selector
   * @param {Object} options - Configuration options
   */
  function initTextReveal(selector, options = {}) {
    if (prefersReducedMotion) {
      document.querySelectorAll(selector).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const config = { ...DEFAULT_CONFIG, threshold: 0.2, ...options };
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      const text = el.textContent;
      const words = text.split(' ');
      el.innerHTML = words.map((word, i) => 
        `<span class="text-reveal-word" style="transition-delay: ${i * 30}ms">${word}</span>`
      ).join(' ');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.text-reveal-word').forEach((word, i) => {
              setTimeout(() => {
                word.style.opacity = '1';
                word.style.transform = 'translateY(0)';
              }, i * 30);
            });
            observer.unobserve(entry.target);
          }
        });
      }, config);
      
      observer.observe(el);
    });
  }

  /**
   * Initialize all scroll animations
   * Call this on DOMContentLoaded
   */
  function initAll() {
    initScrollReveal();
    initStaggeredReveal('.stagger-reveal', '.stagger-item');
    initCounterAnimation('[data-count]');
    initProgressAnimation('.progress-bar[data-progress]');
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Export for manual initialization if needed
  window.ScrollAnimations = {
    initScrollReveal,
    initStaggeredReveal,
    initCounterAnimation,
    initParallax,
    initProgressAnimation,
    initTextReveal,
    initAll
  };
})();