/**
 * TRISGRAPH.JS — Interactive Node Graph Visualizer for Infotris Homepage
 * Handles selection of learning paths and individual node hover highlights.
 */

document.addEventListener('DOMContentLoaded', () => {
  const innerContainer = document.querySelector('.trisgraph-inner');
  const cards = document.querySelectorAll('.trisgraph-card');
  const nodeGroups = document.querySelectorAll('.trisgraph-node-group');
  const lines = document.querySelectorAll('.trisgraph-line');
  const tooltip = document.getElementById('graph-tooltip');
  const tooltipTitle = tooltip ? tooltip.querySelector('.tooltip-title') : null;
  const tooltipDesc = tooltip ? tooltip.querySelector('.tooltip-desc') : null;

  if (!innerContainer) return;

  // Node descriptions database
  const nodeData = {
    infotris: {
      title: "Infotris",
      desc: "The core knowledge hub connecting all learning trails, skills, concepts, and career trajectories."
    },
    python: {
      title: "Python Trail",
      desc: "A versatile language ideal for automation, web backend, data analysis, and AI systems."
    },
    syntax: {
      title: "Syntax & Basics",
      desc: "Foundational rules, variables, control flows, data types, and standard library constructs."
    },
    oop: {
      title: "Object-Oriented Programming",
      desc: "Classes, objects, inheritance, polymorphism, and encapsulation for building reusable software."
    },
    ai: {
      title: "AI & Machine Learning",
      desc: "Algorithms that learn patterns from data, enabling predictions, recommendations, and decisions."
    },
    neuralnetworks: {
      title: "Neural Networks",
      desc: "Deep learning structures modeled after the human brain, used for complex cognitive tasks."
    },
    pytorch: {
      title: "PyTorch & Deep Learning",
      desc: "An open-source machine learning library used for computer vision and natural language processing."
    },
    webdev: {
      title: "Web Development",
      desc: "Building highly interactive web applications spanning frontend components to backend APIs."
    },
    htmlcss: {
      title: "HTML & CSS Layouts",
      desc: "Structuring content and applying premium responsive layouts with vanilla CSS style systems."
    },
    react: {
      title: "React & Component Architecture",
      desc: "A declarative, component-based frontend framework for designing modern web interfaces."
    },
    datascience: {
      title: "Data Science Trail",
      desc: "Analyzing large datasets to discover patterns, draw insights, and drive business intelligence."
    },
    pandas: {
      title: "Pandas & DataFrames",
      desc: "A powerful Python library for data manipulation, analysis, aggregation, and cleanup."
    },
    sql: {
      title: "SQL & Databases",
      desc: "Querying relational database management systems to store, filter, and fetch data."
    },
    statistics: {
      title: "Applied Statistics",
      desc: "Probability, distributions, hypothesis testing, and statistical models to validate assumptions."
    }
  };

  // Set default active path (Python)
  let activePath = 'python';
  innerContainer.setAttribute('data-active-path', activePath);
  updateTooltip(activePath);

  // 1. Path Selector Cards Logic
  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active class from all cards
      cards.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked card
      card.classList.add('active');
      
      // Update active path attribute
      activePath = card.getAttribute('data-path');
      innerContainer.setAttribute('data-active-path', activePath);
      
      // Update tooltip info
      updateTooltip(activePath);
    });
  });

  // Helper to update tooltip to path or node description
  function updateTooltip(key) {
    if (!tooltipTitle || !tooltipDesc) return;
    const data = nodeData[key];
    if (data) {
      tooltipTitle.textContent = data.title;
      tooltipDesc.textContent = data.desc;
    }
  }

  // 2. Node Hover Interaction (SVG hover logic)
  nodeGroups.forEach(nodeGroup => {
    const nodeId = nodeGroup.getAttribute('data-node');

    nodeGroup.addEventListener('mouseenter', () => {
      // Highlight tooltip with node data
      updateTooltip(nodeId);

      // Add hovered node state classes
      nodeGroup.classList.add('active-hover-node');
      
      // Find connected nodes and highlight them
      const connectedNodeIds = new Set();
      connectedNodeIds.add(nodeId);

      lines.forEach(line => {
        const from = line.getAttribute('data-from');
        const to = line.getAttribute('data-to');

        if (from === nodeId || to === nodeId) {
          line.classList.add('active-hover-line');
          connectedNodeIds.add(from);
          connectedNodeIds.add(to);
        }
      });

      // Highlight all neighbor nodes, dim the others
      nodeGroups.forEach(ng => {
        const id = ng.getAttribute('data-node');
        if (connectedNodeIds.has(id)) {
          ng.classList.add('active-hover-neighbor');
        } else {
          ng.classList.add('inactive-hover-node');
        }
      });
    });

    nodeGroup.addEventListener('mouseleave', () => {
      // Restore tooltip to active path description
      updateTooltip(activePath);

      // Remove all hover utility classes
      nodeGroup.classList.remove('active-hover-node');
      
      lines.forEach(line => {
        line.classList.remove('active-hover-line');
      });

      nodeGroups.forEach(ng => {
        ng.classList.remove('active-hover-neighbor');
        ng.classList.remove('inactive-hover-node');
      });
    });
  });
});
