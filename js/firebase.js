// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLTgPKhHvsrHV1lBnjvH9IqtJ61g-UVME",
  authDomain: "infotris.firebaseapp.com",
  projectId: "infotris",
  storageBucket: "infotris.firebasestorage.app",
  messagingSenderId: "639697612588",
  appId: "1:639697612588:web:554d4203c1fbc55a984689",
  measurementId: "G-GW1SZKVKL1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

console.log("🔥 Firebase Connected Successfully!");

// Export for other JS files
export { app, auth, db };
