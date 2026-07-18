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

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.log("✅ Account Created!");

        console.log(userCredential.user);

        alert("Account Created Successfully!");

        window.location.href = "student-dashboard";
    }
        catch(error) {

            console.error("Firebase Error:", error);
            console.error("Code:", error.code);
            console.error("Message:", error.message);
        
            alert(
                "Code: " + error.code +
                "\n\nMessage: " + error.message
            );
        
        }
}