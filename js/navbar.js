import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const navbarUser = document.getElementById("navbar-user");

onAuthStateChanged(auth, (user) => {

    if (user) {

        const name = user.email.split("@")[0];

        navbarUser.innerHTML = `
        
        <div class="profile-menu">

            <button class="profile-btn">

                👤 ${name}

            </button>

            <div class="profile-dropdown">

                <a href="student-dashboard.html">
                    Dashboard
                </a>

                <a href="profile.html">
                    Profile
                </a>

                <a href="#" id="logoutBtn">
                    Logout
                </a>

            </div>

        </div>

        `;

        document
            .getElementById("logoutBtn")
            .addEventListener("click", async (e) => {

                e.preventDefault();

                await signOut(auth);

                location.reload();

            });

    }

});