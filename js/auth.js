import { db } from "./firebase.js";
import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

console.log("✅ Auth.js Loaded");

const form = document.getElementById("authForm");

form.addEventListener("submit", handleAuthSubmit);

async function handleAuthSubmit(event) {

    event.preventDefault();

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    try {

        if (window.currentMode === "signup") {

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("✅ Account Created!");

            alert("Account Created Successfully!");

            window.location.href = "student-dashboard.html";

        } else {

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("✅ Login Successful!");

            alert("Welcome Back!");

            window.location.href = "student-dashboard.html";

        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}