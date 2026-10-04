import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const form = document.getElementById("authForm");

if (form) {
    const authCard = document.querySelector(".auth-card");
    const nameGroup = document.getElementById("groupName");
    const termsGroup = document.getElementById("groupTerms");
    const confirmGroup = document.getElementById("groupConfirmPassword");
    const nameInput = document.getElementById("authName");
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const confirmPasswordInput = document.getElementById("authConfirmPassword");
    const termsInput = document.getElementById("authTerms");
    const submitButton = document.getElementById("authSubmitBtn");
    const footer = document.getElementById("authFooter");
    const tabs = [
        document.getElementById("tabSignup"),
        document.getElementById("tabSignin")
    ];
    const errorMessages = document.querySelectorAll("#authErrorMsg");
    const passwordStrength = document.getElementById("passwordStrength");
    const passwordToggle = document.getElementById("togglePassword");

    loadAuthStylesheet();
    addStoryPanel(authCard);
    setupTabs(tabs);
    setupPasswordControls();
    window.setAuthMode = setAuthMode;
    setAuthMode(window.currentMode || "signup");

    form.addEventListener("submit", handleAuthSubmit);

    function loadAuthStylesheet() {
        if (document.querySelector('link[href="css/auth-page.css"]')) {
            return;
        }

        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = "css/auth-page.css";
        document.head.append(stylesheet);
    }

    function addStoryPanel(card) {
        if (!card) {
            return;
        }

        const story = document.createElement("aside");
        story.className = "auth-story";
        story.setAttribute("aria-labelledby", "auth-story-title");

        const eyebrow = document.createElement("p");
        eyebrow.className = "auth-story__eyebrow";
        eyebrow.textContent = "A clearer path forward";

        const title = document.createElement("h1");
        title.id = "auth-story-title";
        title.className = "auth-story__title";
        title.textContent = "Turn what you learn into skills you can show.";

        const description = document.createElement("p");
        description.className = "auth-story__description";
        description.textContent =
            "Follow a focused trail from your first lesson to a project you're proud to share.";

        const steps = document.createElement("ol");
        steps.className = "auth-story__steps";
        [
            ["01", "Learn", "Build a solid foundation"],
            ["02", "Solve", "Make the ideas stick"],
            ["03", "Build", "Put your skills to work"],
            ["04", "Ship", "Share what you made"]
        ].forEach(([number, label, detail], index) => {
            const item = document.createElement("li");
            item.className = "auth-story__step";
            item.dataset.step = String(index + 1);

            const marker = document.createElement("span");
            marker.className = "auth-story__number";
            marker.textContent = number;
            marker.setAttribute("aria-hidden", "true");

            const copy = document.createElement("span");
            copy.className = "auth-story__copy";

            const name = document.createElement("strong");
            name.textContent = label;

            const hint = document.createElement("span");
            hint.textContent = detail;

            copy.append(name, hint);
            item.append(marker, copy);
            steps.append(item);
        });

        const note = document.createElement("p");
        note.className = "auth-story__note";
        note.textContent = "Less tutorial-hopping. More forward motion.";

        story.append(eyebrow, title, description, steps, note);
        card.before(story);
    }

    function setupTabs(authTabs) {
        document.querySelector(".auth-tabs")?.setAttribute("role", "tablist");
        document.querySelector(".auth-tabs")?.setAttribute("aria-label", "Account access");

        authTabs.forEach((tab) => {
            if (!tab) {
                return;
            }

            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-controls", "authForm");
            tab.tabIndex = tab.classList.contains("active") ? 0 : -1;

            tab.addEventListener("keydown", (event) => {
                if (!["ArrowLeft", "ArrowRight", "Enter", " "].includes(event.key)) {
                    return;
                }

                event.preventDefault();
                const nextMode = tab.id === "tabSignup" ? "signin" : "signup";
                setAuthMode(nextMode);
                document.getElementById(nextMode === "signup" ? "tabSignup" : "tabSignin")?.focus();
            });
        });
    }

    function setAuthMode(mode) {
        const isSignup = mode === "signup";
        window.currentMode = isSignup ? "signup" : "signin";

        document.getElementById("tabSignup")?.classList.toggle("active", isSignup);
        document.getElementById("tabSignin")?.classList.toggle("active", !isSignup);
        document.getElementById("tabSignup")?.setAttribute("aria-selected", String(isSignup));
        document.getElementById("tabSignin")?.setAttribute("aria-selected", String(!isSignup));
        document.getElementById("tabSignup")?.setAttribute("tabindex", isSignup ? "0" : "-1");
        document.getElementById("tabSignin")?.setAttribute("tabindex", isSignup ? "-1" : "0");
        form.setAttribute("aria-labelledby", isSignup ? "tabSignup" : "tabSignin");

        nameGroup.style.display = isSignup ? "flex" : "none";
        termsGroup.style.display = isSignup ? "flex" : "none";
        confirmGroup.style.display = isSignup ? "flex" : "none";
        nameInput.required = isSignup;
        confirmPasswordInput.required = isSignup;
        termsInput.required = isSignup;
        passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
        confirmPasswordInput.autocomplete = "new-password";
        submitButton.textContent = isSignup ? "Create account" : "Sign in";

        footer.replaceChildren(
            document.createTextNode(isSignup ? "Already have an account? " : "New to Infotris? ")
        );
        const switchLink = document.createElement("a");
        switchLink.href = "#";
        switchLink.textContent = isSignup ? "Sign in" : "Create an account";
        switchLink.addEventListener("click", (event) => {
            event.preventDefault();
            setAuthMode(isSignup ? "signin" : "signup");
            document.getElementById(isSignup ? "tabSignin" : "tabSignup")?.focus();
        });
        footer.append(switchLink);

        errorMessages.forEach((message) => {
            message.textContent = "";
            message.style.display = "none";
        });
    }

    function setupPasswordControls() {
        passwordToggle?.setAttribute("aria-label", "Show password");
        passwordToggle?.setAttribute("aria-pressed", "false");

        passwordToggle?.addEventListener("click", () => {
            const shouldShow = passwordInput.type === "password";
            passwordInput.type = shouldShow ? "text" : "password";
            confirmPasswordInput.type = shouldShow ? "text" : "password";
            passwordToggle.textContent = shouldShow ? "Hide" : "Show";
            passwordToggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
            passwordToggle.setAttribute("aria-pressed", String(shouldShow));
        });

        passwordInput.addEventListener("input", () => {
            const password = passwordInput.value;
            let score = 0;
            if (password.length >= 8) score += 1;
            if (/[A-Z]/.test(password)) score += 1;
            if (/[a-z]/.test(password)) score += 1;
            if (/[0-9]/.test(password)) score += 1;
            if (/[^A-Za-z0-9]/.test(password)) score += 1;

            const strength = password.length === 0
                ? "Add a password"
                : ["Weak", "Weak", "Fair", "Good", "Strong", "Very strong"][score];
            passwordStrength.textContent = `Password strength: ${strength}`;
            passwordStrength.dataset.strength = password.length === 0 ? "empty" : String(score);
        });
    }

    function createUserProfile(user, displayName) {
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

    function showError(message) {
        const errorMessage = errorMessages[0];
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.setAttribute("role", "alert");
        errorMessage.setAttribute("aria-live", "polite");
    }

    async function handleAuthSubmit(event) {
        event.preventDefault();

        const isSignup = window.currentMode === "signup";
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        errorMessages.forEach((message) => {
            message.textContent = "";
            message.style.display = "none";
        });

        if (isSignup && password !== confirmPasswordInput.value) {
            showError("Those passwords don't match. Check both fields and try again.");
            confirmPasswordInput.focus();
            return;
        }

        if (isSignup && !nameInput.value.trim()) {
            showError("Enter your name to create an account.");
            nameInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.textContent = isSignup ? "Creating your account..." : "Signing you in...";

        try {
            if (isSignup) {
                const displayName = nameInput.value.trim();
                const { user } = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(user, { displayName });
                await setDoc(
                    doc(db, "users", user.uid),
                    createUserProfile(user, displayName),
                    { merge: true }
                );
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }

            window.location.assign("student-dashboard.html");
        } catch (error) {
            const messages = {
                "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
                "auth/invalid-credential": "That email and password combination wasn't recognized.",
                "auth/invalid-email": "Enter a valid email address and try again.",
                "auth/weak-password": "Choose a stronger password with at least 6 characters.",
                "auth/network-request-failed": "We couldn't connect. Check your internet connection and try again."
            };
            showError(messages[error?.code] || error?.message || "Something went wrong. Please try again.");
        } finally {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
            submitButton.textContent = isSignup ? "Create account" : "Sign in";
        }
    }
}
