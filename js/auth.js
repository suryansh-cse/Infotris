
import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

console.log("✅ Auth.js Loaded");

const form = document.getElementById("authForm");

if (form) {
    form.addEventListener("submit", handleAuthSubmit);
}

function createUserProfile(user) {
    const displayName = user.displayName || user.email.split("@")[0];

    return {
        profile: {
            displayName,
            email: user.email || "",
            joinedAt: serverTimestamp(),
            avatar: user.photoURL || displayName.charAt(0).toUpperCase()
        },
        stats: { level: 1, xp: 0, streak: 0, coins: 0 },
        learning: {
            currentTrail: "python",
            currentLesson: "01-intro",
            progress: { completedItems: [] },
            practice: {},
            quizzes: {}
        },
        missions: {
            weeklyGoals: {
                "python-lessons": false,
                "build-project": false,
                "github-page": false
            }
        },
        achievements: [],
        activity: []
    };
}

async function handleAuthSubmit(event) {

    event.preventDefault();

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    try {
         
         if (window.currentMode === "signup") {

            console.log("🟢 SIGNUP MODE");
        
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await setDoc(doc(db, "users", userCredential.user.uid), createUserProfile(userCredential.user), { merge: true });
        
            console.log("Firebase UID:", userCredential.user.uid);
            console.log("Firebase Email:", userCredential.user.email);
        
            alert("Signup Success");
        
        } else {
        
            console.log("🔵 LOGIN MODE");
        
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
        
            console.log("Login UID:", userCredential.user.uid);
        
            alert("Login Success");
        
        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}
