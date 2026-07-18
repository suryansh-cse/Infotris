
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

            console.log("🟢 SIGNUP MODE");
        
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
        
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