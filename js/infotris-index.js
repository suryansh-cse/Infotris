/* ==========================================================================
   INFOTRIS MASTER SEARCH INDEX — Centralized, extensible knowledge database
   RULES:
   1. Every searchable public item goes here (courses, careers, skills, trails, topics)
   2. Search engine (search.js) reads this index — never hardcode page-specific logic
   3. Add new content types without rewriting search: just add objects with type.
   4. Each item supports: id, type, title, description, url, keywords, tags, skills, category, aliases, related
   Types: course | career | skill | trail | topic
   ========================================================================== */
const INFOTRIS_INDEX = [
    // =========================
    // COURSES — Structured skill trails
    // =========================
    {
        id: "python",
        type: "course",
        title: "Python",
        description: "Complete Python programming — from syntax to projects, 28 lessons, 4 projects.",
        url: "courses/python/",
        keywords: ["python", "programming", "backend", "automation", "coding", "beginner"],
        tags: ["Python", "Programming"],
        skills: ["Python", "Logic", "Automation"],
        category: "Programming",
        aliases: ["py"],
        related: ["python-developer", "python-skill", "python-trail"]
    },
    {
        id: "html",
        type: "course",
        title: "HTML",
        description: "Structure the web with semantic, accessible markup — the skeleton of every site.",
        url: "courses/html/",
        keywords: ["html", "markup", "semantic", "web", "structure", "beginner", "accessibility"],
        tags: ["HTML", "Web"],
        skills: ["HTML", "Semantics", "Accessibility"],
        category: "Web Foundations",
        aliases: [],
        related: ["frontend-developer", "html-skill", "html-trail"]
    },
    {
        id: "css",
        type: "course",
        title: "CSS",
        description: "Style the web — layouts, responsive design, and modern CSS.",
        url: "courses/coming/coming.html",
        keywords: ["css", "styling", "layout", "responsive", "design", "frontend"],
        tags: ["CSS", "Web"],
        skills: ["CSS", "Layout"],
        category: "Web Foundations",
        aliases: [],
        related: ["frontend-developer", "html"]
    },
    {
        id: "javascript",
        type: "course",
        title: "JavaScript",
        description: "Make the web interactive — fundamentals to dynamic apps.",
        url: "courses/coming/coming.html",
        keywords: ["javascript", "js", "frontend", "interactive", "web", "programming"],
        tags: ["JavaScript", "Web"],
        skills: ["JavaScript", "Web"],
        category: "Web Foundations",
        aliases: ["js"],
        related: ["frontend-developer", "javascript-skill"]
    },
    {
        id: "dsa",
        type: "course",
        title: "Data Structures & Algorithms",
        description: "Master data structures and algorithms — the core of efficient problem solving.",
        url: "courses/dsa/",
        keywords: ["dsa", "algorithm", "algorithms", "data structures", "tree", "graph", "linked list"],
        tags: ["DSA", "Algorithms"],
        skills: ["Algorithms", "Problem Solving"],
        category: "Programming",
        aliases: [],
        related: ["dsa-trail"]
    },
    {
        id: "problem-solving",
        type: "course",
        title: "Problem Solving",
        description: "Break down problems, write pseudocode, debug, and practice patterns.",
        url: "courses/problem-solving/",
        keywords: ["problem solving", "debugging", "pseudocode", "patterns", "coding"],
        tags: ["Problem Solving"],
        skills: ["Decomposition", "Debugging"],
        category: "Programming",
        aliases: [],
        related: ["dsa"]
    },
    {
        id: "git",
        type: "course",
        title: "Git & GitHub",
        description: "Version control and collaboration for every developer.",
        url: "courses/coming/coming.html",
        keywords: ["git", "github", "version control", "collaboration"],
        tags: ["Git", "Tools"],
        skills: ["Git", "GitHub"],
        category: "Tools",
        aliases: [],
        related: []
    },
    // =========================
    // CAREERS — Role-inspired trails
    // =========================
    {
        id: "python-developer",
        type: "career",
        title: "Python Developer",
        description: "Build backends, automation, and data workflows with Python.",
        url: "careers/python-developer/",
        keywords: ["python", "developer", "backend", "career", "automation"],
        tags: ["Python", "Career"],
        skills: ["Python", "Backend"],
        category: "Development",
        aliases: [],
        related: ["python", "python-skill"]
    },
    {
        id: "frontend-developer",
        type: "career",
        title: "Frontend Developer",
        description: "Create interfaces with HTML, CSS, and JavaScript — portfolio-ready.",
        url: "courses/coming/coming.html",
        keywords: ["frontend", "web", "html", "css", "javascript", "developer"],
        tags: ["Frontend", "Web"],
        skills: ["HTML", "CSS", "JavaScript"],
        category: "Development",
        aliases: ["frontend", "web developer"],
        related: ["html", "css", "javascript"]
    },
    {
        id: "data-scientist",
        type: "career",
        title: "Data Scientist",
        description: "Analyze data with Python, statistics, and machine learning.",
        url: "courses/coming/coming.html",
        keywords: ["data science", "statistics", "machine learning", "python", "analysis"],
        tags: ["Data", "ML"],
        skills: ["Python", "Statistics", "Machine Learning"],
        category: "Data",
        aliases: ["data science"],
        related: ["python", "machine-learning"]
    },
    {
        id: "ai-engineer",
        type: "career",
        title: "AI Engineer",
        description: "Build practical AI workflows — models, prompts, and automation.",
        url: "courses/coming/coming.html",
        keywords: ["ai", "artificial intelligence", "machine learning", "ml", "engineer"],
        tags: ["AI", "ML"],
        skills: ["AI", "Machine Learning"],
        category: "AI",
        aliases: ["ai", "artificial intelligence"],
        related: ["machine-learning", "python"]
    },
    // =========================
    // SKILLS — Atomic, searchable competencies
    // =========================
    {
        id: "python-skill",
        type: "skill",
        title: "Python",
        description: "General-purpose programming — clean, readable, versatile.",
        url: "courses/python/",
        keywords: ["python", "skill", "programming"],
        tags: ["Python"],
        skills: ["Python"],
        category: "Programming",
        aliases: ["py"],
        related: ["python", "python-developer"]
    },
    {
        id: "html-skill",
        type: "skill",
        title: "HTML",
        description: "Semantic markup — the structure of the web.",
        url: "courses/html/",
        keywords: ["html", "skill", "markup", "semantic"],
        tags: ["HTML"],
        skills: ["HTML"],
        category: "Web",
        aliases: [],
        related: ["html", "frontend-developer"]
    },
    {
        id: "machine-learning",
        type: "skill",
        title: "Machine Learning",
        description: "Algorithms that learn from data — foundations and applications.",
        url: "courses/coming/coming.html",
        keywords: ["machine learning", "ml", "ai", "statistics", "model"],
        tags: ["ML", "AI"],
        skills: ["Machine Learning", "Python", "Statistics"],
        category: "AI",
        aliases: ["ml", "ML"],
        related: ["ai-engineer", "data-scientist", "python"]
    },
    {
        id: "javascript-skill",
        type: "skill",
        title: "JavaScript",
        description: "Interactive web — dynamic behavior in the browser.",
        url: "courses/coming/coming.html",
        keywords: ["javascript", "js", "skill", "web", "interactive"],
        tags: ["JavaScript"],
        skills: ["JavaScript"],
        category: "Web",
        aliases: ["js", "JS"],
        related: ["javascript", "frontend-developer"]
    },
    // =========================
    // TRAILS — Curated learning journeys (Learn → Practice → Build → Progress)
    // =========================
    {
        id: "python-trail",
        type: "trail",
        title: "Python Trail",
        description: "28 lessons, 4 projects — from syntax to shipping, organized for builders.",
        url: "courses/python/",
        keywords: ["python trail", "learning trail", "python", "track"],
        tags: ["Trail", "Python"],
        skills: ["Python"],
        category: "Trail",
        aliases: ["python track"],
        related: ["python", "python-skill"]
    },
    {
        id: "html-trail",
        type: "trail",
        title: "HTML Trail",
        description: "10 lessons, 2 projects — structure the web semantically and accessibly.",
        url: "courses/html/",
        keywords: ["html trail", "web trail", "html", "semantic"],
        tags: ["Trail", "HTML"],
        skills: ["HTML"],
        category: "Trail",
        aliases: ["html track"],
        related: ["html", "html-skill"]
    },
    {
        id: "dsa-trail",
        type: "trail",
        title: "DSA Trail",
        description: "Data structures and algorithms — the core of technical depth.",
        url: "courses/dsa/",
        keywords: ["dsa trail", "algorithms", "data structures"],
        tags: ["Trail", "DSA"],
        skills: ["Algorithms"],
        category: "Trail",
        aliases: [],
        related: ["dsa"]
    }
];

console.log("Infotris Search Index Loaded —", INFOTRIS_INDEX.length, "items");
