/**
 * TRISGRAPH-PAGE.JS — Defensive controller for TrisGraph Explorer
 * - Fully renders even if Firebase fails (no Firebase dependency)
 * - Graceful empty/error/search states
 * - Extensible TRAILS registry (add languages without rewriting page)
 * - Never throws uncaught; every section try/catched
 */
(function () {
  'use strict';

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { console.warn('[TrisGraph]', e); return fallback; }
  }

  // Wait for DOM — supports both module defer and classic
  function ready(cb) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cb, { once: true });
    else cb();
  }

  ready(function () {
    try {
      var body = document.body;
      if (!body) return;

      var selectors = document.querySelectorAll('.trail-selector-btn');
      var nodeGroups = document.querySelectorAll('.trisgraph-node-group');
      var lines = document.querySelectorAll('.trisgraph-line');
      var sequenceHeader = document.getElementById('trail-sequence-header');
      var sequenceTitle = sequenceHeader ? sequenceHeader.querySelector('.sequence-title') : null;
      var sequenceDesc = sequenceHeader ? sequenceHeader.querySelector('.sequence-desc') : null;
      var sequenceSteps = document.getElementById('trail-sequence-steps');
      var ctaContainer = document.getElementById('trail-cta-container');
      var btnHighlightAll = document.getElementById('btn-highlight-all');
      var btnShowAll = document.getElementById('btn-show-all');
      var canvasTooltip = document.getElementById('canvas-node-tooltip');
      var tooltipHeading = canvasTooltip ? canvasTooltip.querySelector('.tooltip-heading') : null;
      var tooltipContent = canvasTooltip ? canvasTooltip.querySelector('.tooltip-content') : null;
      var searchInput = document.getElementById('node-search');
      var searchIndicator = document.getElementById('search-indicator');
      var loadingEl = document.getElementById('tris-loading');
      var errorEl = document.getElementById('tris-error');
      var errorMsgEl = document.getElementById('tris-error-msg');
      var emptyEl = document.getElementById('tris-empty');

      // Mark ready for shell script
      body.setAttribute('data-tris-ready', '1');
      if (loadingEl) loadingEl.hidden = true;

      // ---- Data: extensible, no external fetch ----
      var nodeData = {
        infotris: { title: 'Infotris', desc: 'The central nexus connecting all learning trails — your map for Learn → Practice → Build → Progress.' },
        python: { title: 'Python Core', desc: 'Syntax fundamentals, automation, and library imports — start here.' },
        syntax: { title: 'Syntax & Basics', desc: 'Variables, conditionals, loops, lists, dicts, and scope.' },
        oop: { title: 'Object-Oriented Programming', desc: 'Classes, inheritance, encapsulation — model systems cleanly.' },
        ai: { title: 'Artificial Intelligence & ML', desc: 'Statistical learning, pattern discovery, predictive modeling.' },
        neuralnetworks: { title: 'Neural Networks', desc: 'MLPs, backprop, CNNs/RNNs and training loops.' },
        pytorch: { title: 'PyTorch', desc: 'Tensors, autograd, and training pipelines.' },
        webdev: { title: 'Web Development', desc: 'Responsive UIs wired to database endpoints.' },
        htmlcss: { title: 'HTML & CSS', desc: 'Semantics, grid/flexbox, typography, and variables.' },
        react: { title: 'React', desc: 'Components, state, hooks, and virtual DOM.' },
        datascience: { title: 'Data Science', desc: 'From raw data to insight — tables, queries, and models.' },
        pandas: { title: 'Pandas & DataFrames', desc: 'Read, filter, aggregate, and clean data in Python.' },
        sql: { title: 'SQL Databases', desc: 'Schemas, joins, indexes, and query design.' },
        statistics: { title: 'Applied Statistics', desc: 'Distributions, hypothesis testing, and significance.' },
        dsa: { title: 'DSA — Data Structures & Algorithms', desc: 'Efficient problem-solving for interviews and real software.' },
        'dsa-arrays': { title: 'Arrays & Hashing', desc: 'Foundations for DSA — contiguous memory, maps, and sets.' },
        'dsa-graphs': { title: 'Graphs', desc: 'BFS/DFS, shortest paths, and network reasoning.' },
        'dsa-dp': { title: 'Dynamic Programming', desc: 'Memoization, tabulation, and optimal substructure.' }
      };

      // TRAILS: architecture for adding languages without rewrite
      var trailData = {
        python: {
          title: 'Python Learning Trail',
          desc: 'Foundational programming from syntax to core library integration — 28 lessons, 4 projects.',
          ctaText: 'Start Python Trail',
          ctaUrl: 'courses/python/',
          badge: 'Most travelled',
          steps: [
            { node: 'syntax', label: 'Syntax & Basics', desc: 'Variables, flow controls, loops, and lists.' },
            { node: 'oop', label: 'Object-Oriented Programming', desc: 'Modeling modular systems using classes.' },
            { node: 'pytorch', label: 'PyTorch Deep Learning', desc: 'Tensors and training logic — optional branch.' },
            { node: 'pandas', label: 'Pandas DataFrames', desc: 'Parsing, filtering, and cleaning data tables.' }
          ]
        },
        ai: {
          title: 'AI & Machine Learning Trail',
          desc: 'Neural networks and statistical models — best after Python basics.',
          ctaText: 'Explore AI Skills',
          ctaUrl: 'courses/coming/coming.html',
          badge: 'Coming soon',
          steps: [
            { node: 'python', label: 'Python Programming', desc: 'Core development logic.' },
            { node: 'pytorch', label: 'PyTorch & Datasets', desc: 'Configuring tensors and datasets.' },
            { node: 'neuralnetworks', label: 'Neural Networks', desc: 'Multi-layer deep learning.' }
          ]
        },
        webdev: {
          title: 'Web Development Trail',
          desc: 'Client interfaces and backend data layers — ship interfaces.',
          ctaText: 'Explore Web Dev Skills',
          ctaUrl: 'courses/coming/coming.html',
          badge: 'Coming soon',
          steps: [
            { node: 'htmlcss', label: 'HTML & CSS Layouts', desc: 'Responsive visual structure.' },
            { node: 'react', label: 'React Interfaces', desc: 'Reactive browser components.' },
            { node: 'sql', label: 'SQL Data Structuring', desc: 'Store and fetch from tables.' }
          ]
        },
        datascience: {
          title: 'Data Science Trail',
          desc: 'Statistics and scripting pipelines for large-scale data.',
          ctaText: 'Start Data Science Path',
          ctaUrl: 'courses/coming/coming.html',
          badge: 'Coming soon',
          steps: [
            { node: 'python', label: 'Python Basics', desc: 'Automation and scripting.' },
            { node: 'pandas', label: 'Pandas Aggregations', desc: 'Processing data tables cleanly.' },
            { node: 'sql', label: 'SQL Query Optimization', desc: 'Managing databases & stores.' },
            { node: 'statistics', label: 'Applied Statistics', desc: 'Probability distribution models.' }
          ]
        },
        dsa: {
          title: 'DSA Trail',
          desc: 'Data structures & algorithms — write optimized, efficient code and ace technical depth.',
          ctaText: 'Explore DSA Trail',
          ctaUrl: 'courses/dsa/',
          badge: 'New',
          steps: [
            { node: 'dsa', label: 'DSA Foundations', desc: 'Big-O, arrays, and hashing.' },
            { node: 'dsa-arrays', label: 'Arrays & Hashing', desc: 'Core building blocks.' },
            { node: 'dsa-graphs', label: 'Graphs & Search', desc: 'BFS/DFS and shortest paths.' },
            { node: 'dsa-dp', label: 'Dynamic Programming', desc: 'Memoization and optimal solutions.' }
          ]
        }
      };

      // Allow future trails (javascript, cpp, java) without editing logic:
      // trailData.javascript = { title: '...', ... } — just add entry.

      var activePath = 'python';
      var viewMode = 'trail';

      function setBodyAttrs() {
        safe(function () {
          body.setAttribute('data-active-path', activePath);
          body.setAttribute('data-view-mode', viewMode);
        });
      }

      function updateCanvasTooltip(key) {
        safe(function () {
          if (!tooltipHeading || !tooltipContent) return;
          var data = nodeData[key];
          if (data) {
            tooltipHeading.textContent = data.title;
            tooltipContent.textContent = data.desc;
          } else {
            tooltipHeading.textContent = 'Select a node';
            tooltipContent.textContent = 'Hover or search to explore skills and how they connect.';
          }
        });
      }

      function renderTrailSteps(pathKey) {
        safe(function () {
          if (!sequenceTitle || !sequenceDesc || !sequenceSteps || !ctaContainer) return;
          var data = trailData[pathKey];
          if (!data) {
            // Graceful empty state — don't leave stale content
            sequenceTitle.textContent = 'Trail coming soon';
            sequenceDesc.textContent = 'This trail is being organized. The Python trail is ready to start, or explore DSA.';
            sequenceSteps.innerHTML = '';
            if (emptyEl) emptyEl.hidden = false;
            ctaContainer.innerHTML = '<a href="courses/python/" class="btn-sidebar-cta">Start Python Trail</a> <a href="courses/dsa/" class="btn-sidebar-cta" style="background:#fff;color:var(--text-primary);border:1px solid var(--border-color);margin-top:.5rem;">Explore DSA</a>';
            return;
          }
          if (emptyEl) emptyEl.hidden = true;
          sequenceTitle.textContent = data.title || pathKey;
          sequenceDesc.textContent = data.desc || '';
          sequenceSteps.innerHTML = '';
          var steps = Array.isArray(data.steps) ? data.steps : [];
          if (steps.length === 0) {
            var emptyStep = document.createElement('div');
            emptyStep.className = 'tris-state tris-empty';
            emptyStep.textContent = 'Steps for this trail are being added. Check back soon.';
            sequenceSteps.appendChild(emptyStep);
          } else {
            steps.forEach(function (step) {
              var stepDiv = document.createElement('div');
              stepDiv.className = 'sequence-step active';
              if (step.node) stepDiv.setAttribute('data-step-node', step.node);
              var label = document.createElement('span');
              label.className = 'step-label';
              label.textContent = step.label || step.node || 'Step';
              var desc = document.createElement('span');
              desc.className = 'step-desc';
              desc.textContent = step.desc || '';
              stepDiv.appendChild(label);
              stepDiv.appendChild(desc);
              stepDiv.addEventListener('mouseenter', function () { highlightNodeInSvg(step.node); });
              stepDiv.addEventListener('mouseleave', function () { clearSvgNodeHighlights(); });
              sequenceSteps.appendChild(stepDiv);
            });
          }
          // Safe CTA — escape via textContent, never raw innerHTML from external
          ctaContainer.innerHTML = '';
          var cta = document.createElement('a');
          cta.href = data.ctaUrl || 'courses/python/';
          cta.className = 'btn-sidebar-cta';
          cta.textContent = data.ctaText || 'Explore Trail';
          ctaContainer.appendChild(cta);
        });
      }

      function highlightNodeInSvg(nodeId) {
        safe(function () {
          if (!nodeId) return;
          var mainGroup = document.querySelector('.trisgraph-node-group[data-node="' + CSS.escape(nodeId) + '"]');
          if (mainGroup) mainGroup.classList.add('active-hover-node');
          var neighbors = new Set([nodeId]);
          lines.forEach(function (line) {
            var from = line.getAttribute('data-from');
            var to = line.getAttribute('data-to');
            if (from === nodeId || to === nodeId) {
              line.classList.add('active-hover-line');
              if (from) neighbors.add(from);
              if (to) neighbors.add(to);
            }
          });
          nodeGroups.forEach(function (ng) {
            var id = ng.getAttribute('data-node');
            if (neighbors.has(id)) ng.classList.add('active-hover-neighbor');
            else ng.classList.add('inactive-hover-node');
          });
        });
      }

      function clearSvgNodeHighlights() {
        safe(function () {
          nodeGroups.forEach(function (ng) {
            ng.classList.remove('active-hover-node', 'active-hover-neighbor', 'inactive-hover-node');
          });
          lines.forEach(function (line) { line.classList.remove('active-hover-line'); });
        });
      }

      // Init
      setBodyAttrs();
      renderTrailSteps(activePath);
      updateCanvasTooltip(activePath);

      // Selectors
      selectors.forEach(function (btn) {
        btn.addEventListener('click', function () {
          safe(function () {
            selectors.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            var next = btn.getAttribute('data-path') || 'python';
            activePath = next;
            setBodyAttrs();
            renderTrailSteps(activePath);
            updateCanvasTooltip(activePath);
            clearSearch();
          });
        });
      });

      // SVG hover
      nodeGroups.forEach(function (nodeGroup) {
        var nodeId = nodeGroup.getAttribute('data-node');
        nodeGroup.addEventListener('mouseenter', function () {
          updateCanvasTooltip(nodeId);
          highlightNodeInSvg(nodeId);
        });
        nodeGroup.addEventListener('mouseleave', function () {
          updateCanvasTooltip(activePath);
          clearSvgNodeHighlights();
        });
        // Keyboard accessibility
        nodeGroup.setAttribute('tabindex', '0');
        nodeGroup.setAttribute('role', 'button');
        nodeGroup.setAttribute('aria-label', (nodeData[nodeId] && nodeData[nodeId].title) || nodeId);
        nodeGroup.addEventListener('focus', function () { updateCanvasTooltip(nodeId); highlightNodeInSvg(nodeId); });
        nodeGroup.addEventListener('blur', function () { updateCanvasTooltip(activePath); clearSvgNodeHighlights(); });
        nodeGroup.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); highlightNodeInSvg(nodeId); }
        });
      });

      // Canvas toggles
      if (btnHighlightAll && btnShowAll) {
        btnHighlightAll.addEventListener('click', function () {
          btnShowAll.classList.remove('active');
          btnHighlightAll.classList.add('active');
          viewMode = 'trail';
          setBodyAttrs();
        });
        btnShowAll.addEventListener('click', function () {
          btnHighlightAll.classList.remove('active');
          btnShowAll.classList.add('active');
          viewMode = 'mesh';
          setBodyAttrs();
        });
      }

      // Search
      function clearSearch() {
        safe(function () {
          if (searchInput) searchInput.value = '';
          if (searchIndicator) { searchIndicator.classList.remove('active'); searchIndicator.textContent = ''; }
          nodeGroups.forEach(function (ng) { ng.classList.remove('search-match-node'); });
        });
      }

      if (searchInput && searchIndicator) {
        searchInput.addEventListener('input', function () {
          safe(function () {
            var query = (searchInput.value || '').trim().toLowerCase();
            nodeGroups.forEach(function (ng) { ng.classList.remove('search-match-node'); });
            if (!query) {
              searchIndicator.classList.remove('active');
              searchIndicator.textContent = '';
              updateCanvasTooltip(activePath);
              return;
            }
            var matches = [];
            Object.keys(nodeData).forEach(function (key) {
              var d = nodeData[key];
              if (!d) return;
              if (key.toLowerCase().indexOf(query) !== -1 || (d.title && d.title.toLowerCase().indexOf(query) !== -1)) {
                matches.push(key);
              }
            });
            if (matches.length > 0) {
              searchIndicator.textContent = matches.length + ' match' + (matches.length > 1 ? 'es' : '');
              searchIndicator.classList.add('active');
              matches.forEach(function (mKey) {
                var matched = document.querySelector('.trisgraph-node-group[data-node="' + CSS.escape(mKey) + '"]');
                if (matched) matched.classList.add('search-match-node');
              });
              updateCanvasTooltip(matches[0]);
            } else {
              searchIndicator.textContent = 'No matches';
              searchIndicator.classList.add('active');
            }
          });
        });
      }

      // Global error guard — never blank
      window.addEventListener('error', function (e) {
        safe(function () {
          if (errorEl) {
            errorEl.hidden = false;
            if (errorMsgEl) errorMsgEl.textContent = ' Something went wrong, but the sidebar and graph remain browsable.';
          }
        });
      });

    } catch (err) {
      console.error('[TrisGraph] init failed', err);
      try {
        var b = document.body; if (b) b.setAttribute('data-tris-ready', '1');
        var le = document.getElementById('tris-loading'); if (le) le.hidden = true;
        var ee = document.getElementById('tris-error'); if (ee) ee.hidden = false;
      } catch (_) {}
    }
  });
})();
