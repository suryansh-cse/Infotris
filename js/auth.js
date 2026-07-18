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

    console.log("Submit Clicked");

}