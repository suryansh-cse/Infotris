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
        id: "html",

        type: "course",

        title: "HTML",

        description:
            "HTML Complete Course",

        keywords: [
            "html",
            "frontend",
            "website",
            "web"
        ],

        url: "courses/html/"
    },

    {
        id: "css",

        type: "course",

        title: "CSS",

        description:
            "CSS Styling",

        keywords: [
            "css",
            "frontend",
            "design"
        ],

        url: "courses/css/"
    },

    {
        id: "javascript",

        type: "course",

        title: "JavaScript",

        description:
            "Modern JavaScript",

        keywords: [
            "javascript",
            "js",
            "frontend",
            "web"
        ],

        url: "courses/javascript/"
    },



    // =========================
    // CAREERS
    // =========================

    {

        id:"python-developer",

        type:"career",

        title:"Python Developer",

        description:
        "Become a Python Developer.",

        keywords:[
            "python",
            "developer",
            "backend",
            "career"
        ],

        url:"careers/python-developer/"

    },

    {

        id:"frontend-developer",

        type:"career",

        title:"Frontend Developer",

        description:
        "Frontend Career",

        keywords:[
            "frontend",
            "html",
            "css",
            "javascript"
        ],

            url:"careers/frontend-developer/"

    }

    
];
console.log("Infotris Database Loaded");