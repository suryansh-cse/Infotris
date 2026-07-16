/**
 * TRISGRAPH-PAGE.JS — Controller Logic for Dedicated TrisGraph Explorer
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const selectors = document.querySelectorAll('.trail-selector-btn');
  const nodeGroups = document.querySelectorAll('.trisgraph-node-group');
  const lines = document.querySelectorAll('.trisgraph-line');
  
  // Sidebar elements
  const sequenceHeader = document.getElementById('trail-sequence-header');
  const sequenceTitle = sequenceHeader ? sequenceHeader.querySelector('.sequence-title') : null;
  const sequenceDesc = sequenceHeader ? sequenceHeader.querySelector('.sequence-desc') : null;
  const sequenceSteps = document.getElementById('trail-sequence-steps');
  const ctaContainer = document.getElementById('trail-cta-container');

  // Canvas elements
  const btnHighlightAll = document.getElementById('btn-highlight-all');
  const btnShowAll = document.getElementById('btn-show-all');
  const canvasTooltip = document.getElementById('canvas-node-tooltip');
  const tooltipHeading = canvasTooltip ? canvasTooltip.querySelector('.tooltip-heading') : null;
  const tooltipContent = canvasTooltip ? canvasTooltip.querySelector('.tooltip-content') : null;

  // Search elements
  const searchInput = document.getElementById('node-search');
  const searchIndicator = document.getElementById('search-indicator');

  if (!body) return;

  // Database of node descriptions
  const nodeData = {
    infotris: {
      title: "Infotris",
      desc: "The central nexus connecting all learning trails, concept nodes, and professional career goals."
    },
    python: {
      title: "Python Core",
      desc: "Syntax fundamentals, automation scripting, and library imports — recommended for beginners."
    },
    syntax: {
      title: "Syntax & Basics",
      desc: "Variables, conditional logic, loops, data structures (lists, tuples, dicts), and scoping."
    },
    oop: {
      title: "Object-Oriented Programming",
      desc: "Structuring code through reusable class blueprints, inheritance, and encapsulation methods."
    },
    ai: {
      title: "Artificial Intelligence & ML",
      desc: "Algorithms modeled on statistical parsing, patterns discovery, and predictive training paths."
    },
    neuralnetworks: {
      title: "Neural Networks & Deep Learning",
      desc: "Multi-layer perceptrons, forward-backward propagation, weights fine-tuning, and CNN/RNN concepts."
    },
    pytorch: {
      title: "PyTorch Framework",
      desc: "Deploying tensor calculations, computational graphs, and training layers for machine learning."
    },
    webdev: {
      title: "Web Development Trail",
      desc: "Connecting responsive client layouts to database endpoints for production-grade shipping."
    },
    htmlcss: {
      title: "HTML & CSS Layouts",
      desc: "Semantic elements, grid/flexbox controls, typography hierarchy, and CSS variable styling."
    },
    react: {
      title: "React Components",
      desc: "Designing responsive UI systems through component states, virtual DOM structures, and hooks."
    },
    datascience: {
      title: "Data Science Trail",
      desc: "Organizing raw datasets into clear summaries, visualizations, and predictive models."
    },
    pandas: {
      title: "Pandas & Data Manipulation",
      desc: "Reading files, indexing vectors, filtering DataFrames, and aggregations using Python."
    },
    sql: {
      title: "SQL Databases",
      desc: "Structuring database schemas, query writing, table join actions, and indexing operations."
    },
    statistics: {
      title: "Applied Probability & Stats",
      desc: "Validating mathematical hypotheses, distributions, significance criteria, and standard deviations."
    }
  };

  // Learning trail metadata
  const trailData = {
    python: {
      title: "Python Learning Trail",
      desc: "Foundational programming from syntax to core library integration.",
      ctaText: "Start Python Trail",
      ctaUrl: "courses/python/",
      steps: [
        { node: "syntax", label: "Syntax & Basics", desc: "Variables, flow controls, loops, and lists." },
        { node: "oop", label: "Object-Oriented Programming", desc: "Modeling modular systems using classes." },
        { node: "pytorch", label: "PyTorch Deep Learning", desc: "Deep learning models syntax & logic." },
        { node: "pandas", label: "Pandas DataFrames", desc: "Parsing, filtering, and cleaning data tables." }
      ]
    },
    ai: {
      title: "AI & Machine Learning Trail",
      desc: "Advanced neural networks and statistical models for predictive analytics.",
      ctaText: "Explore AI Courses",
      ctaUrl: "courses/coming/coming.html",
      steps: [
        { node: "python", label: "Python Programming", desc: "Establishing core development logic." },
        { node: "pytorch", label: "PyTorch & Datasets", desc: "Configuring machine learning tensors." },
        { node: "neuralnetworks", label: "Neural Networks", desc: "Modeling brain-like deep neural layers." }
      ]
    },
    webdev: {
      title: "Web Development Trail",
      desc: "Building client interfaces and querying backend database layers.",
      ctaText: "Explore Web Dev Courses",
      ctaUrl: "courses/coming/coming.html",
      steps: [
        { node: "htmlcss", label: "HTML & CSS Layouts", desc: "Building responsive visual outlines." },
        { node: "react", label: "React Interfaces", desc: "Creating reactive browser components." },
        { node: "sql", label: "SQL Data Structuring", desc: "Storing and fetching data from tables." }
      ]
    },
    datascience: {
      title: "Data Science Trail",
      desc: "Applying statistics and scripting pipelines to analyze large-scale datasets.",
      ctaText: "Start Data Science Path",
      ctaUrl: "courses/coming/coming.html",
      steps: [
        { node: "python", label: "Python Basics", desc: "Using Python for automation scripts." },
        { node: "pandas", label: "Pandas Aggregations", desc: "Processing data tables cleanly." },
        { node: "sql", label: "SQL Query Optimization", desc: "Managing databases & data stores." },
        { node: "statistics", label: "Applied Statistics", desc: "Running probability distribution models." }
      ]
    }
  };

  // State Management
  let activePath = 'python';
  let viewMode = 'trail'; // 'trail' or 'mesh'

  // Initialize
  body.setAttribute('data-active-path', activePath);
  body.setAttribute('data-view-mode', viewMode);
  renderTrailSteps(activePath);
  updateCanvasTooltip(activePath);

  // 1. Selector click mapping
  selectors.forEach(btn => {
    btn.addEventListener('click', () => {
      selectors.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activePath = btn.getAttribute('data-path');
      body.setAttribute('data-active-path', activePath);

      renderTrailSteps(activePath);
      updateCanvasTooltip(activePath);
      clearSearch();
    });
  });

  // Helper: Generates timeline in the sidebar
  function renderTrailSteps(pathKey) {
    if (!sequenceTitle || !sequenceDesc || !sequenceSteps || !ctaContainer) return;

    const data = trailData[pathKey];
    if (!data) return;

    sequenceTitle.textContent = data.title;
    sequenceDesc.textContent = data.desc;

    // Build steps HTML
    sequenceSteps.innerHTML = '';
    data.steps.forEach(step => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'sequence-step active';
      stepDiv.setAttribute('data-step-node', step.node);

      stepDiv.innerHTML = `
        <span class="step-label">${step.label}</span>
        <span class="step-desc">${step.desc}</span>
      `;

      // Hover timeline step highlights corresponding SVG node
      stepDiv.addEventListener('mouseenter', () => {
        highlightNodeInSvg(step.node);
      });
      stepDiv.addEventListener('mouseleave', () => {
        clearSvgNodeHighlights();
      });

      sequenceSteps.appendChild(stepDiv);
    });

    // Build CTA Link
    ctaContainer.innerHTML = `<a href="${data.ctaUrl}" class="btn-sidebar-cta">${data.ctaText}</a>`;
  }

  // Helper: update tooltips
  function updateCanvasTooltip(key) {
    if (!tooltipHeading || !tooltipContent) return;
    const data = nodeData[key];
    if (data) {
      tooltipHeading.textContent = data.title;
      tooltipContent.textContent = data.desc;
    }
  }

  // 2. SVG Node Hover Highlights
  nodeGroups.forEach(nodeGroup => {
    const nodeId = nodeGroup.getAttribute('data-node');

    nodeGroup.addEventListener('mouseenter', () => {
      updateCanvasTooltip(nodeId);
      highlightNodeInSvg(nodeId);
    });

    nodeGroup.addEventListener('mouseleave', () => {
      updateCanvasTooltip(activePath);
      clearSvgNodeHighlights();
    });
  });

  // Helper: SVG Node highlights core
  function highlightNodeInSvg(nodeId) {
    // Add class to hovered group
    const mainGroup = document.querySelector(`.trisgraph-node-group[data-node="${nodeId}"]`);
    if (mainGroup) {
      mainGroup.classList.add('active-hover-node');
    }

    // Set connection lines classes
    const neighbors = new Set();
    neighbors.add(nodeId);

    lines.forEach(line => {
      const from = line.getAttribute('data-from');
      const to = line.getAttribute('data-to');

      if (from === nodeId || to === nodeId) {
        line.classList.add('active-hover-line');
        neighbors.add(from);
        neighbors.add(to);
      }
    });

    // Highlight neighbors, dim rest
    nodeGroups.forEach(ng => {
      const id = ng.getAttribute('data-node');
      if (neighbors.has(id)) {
        ng.classList.add('active-hover-neighbor');
      } else {
        ng.classList.add('inactive-hover-node');
      }
    });
  }

  function clearSvgNodeHighlights() {
    nodeGroups.forEach(ng => {
      ng.classList.remove('active-hover-node');
      ng.classList.remove('active-hover-neighbor');
      ng.classList.remove('inactive-hover-node');
    });

    lines.forEach(line => {
      line.classList.remove('active-hover-line');
    });
  }

  // 3. Canvas Mode Toggles
  if (btnHighlightAll && btnShowAll) {
    btnHighlightAll.addEventListener('click', () => {
      btnShowAll.classList.remove('active');
      btnHighlightAll.classList.add('active');
      viewMode = 'trail';
      body.setAttribute('data-view-mode', viewMode);
    });

    btnShowAll.addEventListener('click', () => {
      btnHighlightAll.classList.remove('active');
      btnShowAll.classList.add('active');
      viewMode = 'mesh';
      body.setAttribute('data-view-mode', viewMode);
    });
  }

  // 4. Node Search System
  if (searchInput && searchIndicator) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();

      // Clear previous search matches
      nodeGroups.forEach(ng => ng.classList.remove('search-match-node'));

      if (query === '') {
        searchIndicator.classList.remove('active');
        searchIndicator.textContent = '';
        return;
      }

      // Filter matches
      const matches = [];
      Object.keys(nodeData).forEach(key => {
        if (key.includes(query) || nodeData[key].title.toLowerCase().includes(query)) {
          matches.push(key);
        }
      });

      if (matches.length > 0) {
        searchIndicator.textContent = `${matches.length} matches`;
        searchIndicator.classList.add('active');

        // Apply matching css animations to matched node tags in SVG
        matches.forEach(mKey => {
          const matchedGroup = document.querySelector(`.trisgraph-node-group[data-node="${mKey}"]`);
          if (matchedGroup) {
            matchedGroup.classList.add('search-match-node');
          }
        });

        // Focus the details panel on the primary matched node
        updateCanvasTooltip(matches[0]);
      } else {
        searchIndicator.textContent = 'No matches';
        searchIndicator.classList.add('active');
      }
    });
  }

  function clearSearch() {
    if (searchInput && searchIndicator) {
      searchInput.value = '';
      searchIndicator.classList.remove('active');
      nodeGroups.forEach(ng => ng.classList.remove('search-match-node'));
    }
  }
});
