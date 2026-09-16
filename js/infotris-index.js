/*
==========================================
INFOTRIS MASTER SEARCH DATABASE
==========================================

RULES

1. Every searchable item goes here.
2. Search.js NEVER needs editing.
3. Only add new objects.

Types:
course
career

*/

const INFOTRIS_INDEX = [

    // =========================
    // COURSES
    // =========================

    {
        id: "python",
        type: "course",

        title: "Python",

        description:
            "Complete Python programming course.",

        keywords: [
            "python",
            "programming",
            "backend",
            "automation",
            "coding",
            "beginner"
        ],

        url: "courses/python/"
    },

    {
        id: "dsa",
        type: "course",

        title: "Data Structures & Algorithms",

        description:
            "Master data structures and algorithms.",

        keywords: [
            "dsa",
            "algorithm",
            "algorithms",
            "data structures",
            "tree",
            "graph",
            "linked list"
        ],

        url: "courses/dsa/"
    },

    {
        id: "problem-solving",
        type: "course",

        title: "Problem Solving",

        description:
            "Learn to break down problems, write pseudocode, debug, and practice coding patterns.",

        keywords: [
            "problem solving",
            "debugging",
            "pseudocode",
            "patterns",
            "coding"
        ],

        url: "courses/problem-solving/"
    },


    // =========================
    // CAREERS
    // =========================

    {
        id: "python-developer",
        type: "career",

        title: "Python Developer",

        description:
            "Become a Python Developer.",

        keywords: [
            "python",
            "developer",
            "backend",
            "career"
        ],

        url: "careers/python-developer/"
    }
    
];
console.log("Infotris Database Loaded");