import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const defaultState = {
  displayName: "",
  username: "",
  headline: "",
  degree: "",
  college: "",
  year: "",
  location: "",
  bio: "",
  aboutText: "",
  careerDirection: "",
  careerInterests: [],
  socials: { github: "", linkedin: "", portfolio: "" },
  avatar: "",
  banner: "",
  skills: [],
  stats: [
    { number: 0, label: "Lessons" },
    { number: 0, label: "XP" },
    { number: 0, label: "Streak" },
    { number: 1, label: "Level" }
  ],
  currentlyLearning: [],
  milestones: [],
  achievements: [],
  projects: [],
  activity: []
};

let currentUser = null;
let state = structuredClone(defaultState);

const elements = {
  avatar: document.getElementById("profile-avatar"),
  banner: document.getElementById("profile-banner"),
  name: document.getElementById("profile-name"),
  username: document.getElementById("profile-username"),
  headline: document.getElementById("profile-headline"),
  degree: document.getElementById("profile-degree"),
  college: document.getElementById("profile-college"),
  year: document.getElementById("profile-year"),
  location: document.getElementById("profile-location"),
  bio: document.getElementById("profile-bio"),
  about: document.getElementById("about-copy"),
  socialLinks: document.getElementById("profile-socialLinks"),
  currentlyLearning: document.getElementById("currently-learning-list"),
  milestones: document.getElementById("milestones-list"),
  achievements: document.getElementById("achievements-list"),
  projects: document.getElementById("projects-list"),
  stats: document.getElementById("stats-list"),
  skills: document.getElementById("skills-list"),
  careerDirection: document.getElementById("career-direction"),
  careerInterests: document.getElementById("career-interests"),
  activity: document.getElementById("activity-list"),
  modal: document.getElementById("profileModal"),
  form: document.getElementById("profileForm"),
  editButton: document.getElementById("editProfileButton"),
  navUser: document.getElementById("navbar-user"),
  saveStatus: document.getElementById("profile-save-status")
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("editProfileButton")?.addEventListener("click", openProfileModal);
  document.getElementById("closeModalButton")?.addEventListener("click", closeProfileModal);
  document.getElementById("cancelProfileButton")?.addEventListener("click", closeProfileModal);
  elements.modal?.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeProfileModal();
  });
  elements.form?.addEventListener("submit", handleProfileSave);

  attachAuthListener();
  renderAuthNavigation();
  renderProfile();
});

function attachAuthListener() {
  if (!auth) {
    setSaveStatus("Profile sign-in is unavailable right now. Please reload and try again.", true);
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    renderAuthNavigation();
    if (!user) {
      state = structuredClone(defaultState);
      renderProfile();
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const profile = userData.profile || {};
      const stats = userData.stats || {};
      const learning = userData.learning || {};
      const progress = learning.progress || {};
      const completedItems = Array.isArray(progress.completedItems) ? progress.completedItems : [];
      const trailName = learning.currentTrail
        ? String(learning.currentTrail).replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "";
      const achievements = Array.isArray(userData.achievements) ? userData.achievements : [];
      const activity = Array.isArray(userData.activity) ? userData.activity : [];

      state = {
        ...structuredClone(defaultState),
        displayName: profile.displayName || user.displayName || user.email?.split("@")[0] || "Learner",
        username: profile.username || sanitizeUsername(profile.displayName || user.displayName || user.email?.split("@")[0] || "learner"),
        headline: profile.headline || "",
        degree: profile.degree || "",
        college: profile.college || "",
        year: profile.year || "",
        location: profile.location || "",
        bio: profile.bio || "",
        aboutText: profile.aboutText || profile.bio || "",
        careerDirection: profile.careerDirection || "",
        careerInterests: Array.isArray(profile.careerInterests) ? profile.careerInterests : (Array.isArray(profile.interests) ? profile.interests : []),
        socials: {
          github: profile.socialLinks?.github || profile.github || "",
          linkedin: profile.socialLinks?.linkedin || profile.linkedin || "",
          portfolio: profile.socialLinks?.portfolio || profile.website || ""
        },
        avatar: profile.avatar && /^https?:\/\//i.test(profile.avatar) ? profile.avatar : (profile.avatarUrl || user.photoURL || ""),
        banner: profile.banner || profile.bannerUrl || "",
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        stats: normalizeStats(stats, completedItems.length),
        currentlyLearning: trailName ? [{
          name: trailName,
          percent: Math.min(100, Math.round(completedItems.length / 28 * 100))
        }] : [],
        milestones: Array.isArray(userData.milestones) ? userData.milestones : [],
        achievements: achievements.map((item) => typeof item === "string" ? { name: item } : item),
        projects: Array.isArray(userData.projects) ? userData.projects : [],
        activity: activity.map((item) => typeof item === "string" ? { text: item } : item)
      };
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setSaveStatus("Could not load your profile. Check your connection and reload.", true);
    }

    renderProfile();
    renderAuthNavigation();
  });
}

function normalizeStats(stats, completedCount) {
  return [
    { number: completedCount, label: "Lessons" },
    { number: Number(stats.xp) || 0, label: "XP" },
    { number: Number(stats.streak) || 0, label: "Streak" },
    { number: Number(stats.level) || 1, label: "Level" }
  ];
}

function renderProfile() {
  const avatarElement = elements.avatar;
  const bannerElement = elements.banner;

  if (avatarElement) {
    if (state.avatar && isHttpUrl(state.avatar)) {
      avatarElement.innerHTML = `<img src="${escapeHtml(state.avatar)}" alt="${escapeHtml(state.displayName)}" />`;
    } else {
      avatarElement.textContent = initialsFor(state.displayName);
    }
  }

  if (bannerElement) {
    bannerElement.style.backgroundImage = state.banner && isHttpUrl(state.banner)
      ? `url("${state.banner.replace(/["\\\n\r]/g, "")}")`
      : "linear-gradient(135deg, #f0efe9 0%, #e7e4df 100%)";
    bannerElement.style.backgroundSize = "cover";
    bannerElement.style.backgroundPosition = "center";
  }

  if (elements.name) elements.name.textContent = currentUser ? state.displayName || "Learner" : "Sign in to view your profile";
  if (elements.username) elements.username.textContent = currentUser && state.username ? `@${state.username}` : "";
  if (elements.headline) elements.headline.textContent = state.headline;
  if (elements.degree) elements.degree.textContent = state.degree;
  if (elements.college) elements.college.textContent = state.college;
  if (elements.year) elements.year.textContent = state.year;
  if (elements.location) elements.location.textContent = state.location;
  if (elements.bio) elements.bio.textContent = state.bio;
  if (elements.about) elements.about.textContent = state.aboutText || state.bio || (currentUser ? "Add a short introduction in Edit Profile." : "Sign in to start building your learning profile.");
  const meta = elements.degree?.parentElement;
  if (meta) meta.hidden = ![state.degree, state.college, state.year, state.location].some(Boolean);
  if (elements.headline) elements.headline.hidden = !state.headline;
  if (elements.bio) elements.bio.hidden = !state.bio;
  if (elements.editButton) elements.editButton.disabled = !currentUser;

  renderSocialLinks();
  renderCurrentlyLearning();
  renderMilestones();
  renderAchievements();
  renderProjects();
  renderStats();
  renderSkills();
  renderCareer();
  renderActivity();

}

function renderAuthNavigation() {
  if (!elements.navUser) return;
  if (!currentUser) {
    elements.navUser.innerHTML = '<a class="btn-sign-in" href="signup.html">Sign In</a>';
    return;
  }
  const displayName = escapeHtml(state.displayName || currentUser.displayName || currentUser.email?.split("@")[0] || "Account");
  elements.navUser.innerHTML = `
    <div class="navbar-user" tabindex="0" aria-label="User menu">
      <span class="navbar-user-name">${displayName}</span>
      <div class="profile-dropdown">
        <a href="student-dashboard.html">Dashboard</a>
        <a href="profile.html" aria-current="page">Profile</a>
        <button type="button" id="profile-sign-out">Sign Out</button>
      </div>
    </div>`;
  elements.navUser.querySelector("#profile-sign-out")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "signup.html";
    } catch (error) {
      console.error("Could not sign out:", error);
      setSaveStatus("Could not sign out. Please try again.", true);
    }
  });
}

function renderSocialLinks() {
  if (!elements.socialLinks) return;
  const socials = [];
  if (state.socials.github) socials.push({ label: "GitHub", url: state.socials.github });
  if (state.socials.linkedin) socials.push({ label: "LinkedIn", url: state.socials.linkedin });
  if (state.socials.portfolio) socials.push({ label: "Portfolio", url: state.socials.portfolio });

  if (!socials.length) {
    elements.socialLinks.innerHTML = currentUser
      ? '<span class="empty-state">Add your links in the editor to share your work.</span>'
      : "";
    return;
  }

  elements.socialLinks.innerHTML = socials.map((link) => `<a class="social-pill" href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`).join("");
}

function renderCurrentlyLearning() {
  if (!elements.currentlyLearning) return;
  if (!state.currentlyLearning || !state.currentlyLearning.length) {
    elements.currentlyLearning.innerHTML = '<div class="empty-state">No active learning trail yet. Start with a core trail and your progress will appear here.</div>';
    return;
  }

  elements.currentlyLearning.innerHTML = state.currentlyLearning.map((item) => `
    <div class="learning-item">
      <div class="learning-head">
        <div class="learning-name">${escapeHtml(item.name)}</div>
        <div class="learning-percent">${Math.max(0, Math.min(100, Number(item.percent || 0)))}%</div>
      </div>
      <div class="progress-track">
        <span class="progress-fill" style="width: ${Math.max(0, Math.min(100, Number(item.percent || 0)))}%"></span>
      </div>
    </div>
  `).join("");
}

function renderMilestones() {
  if (!elements.milestones) return;
  if (!state.milestones || !state.milestones.length) {
    elements.milestones.innerHTML = '<div class="empty-state">Your completed learning milestones will appear here.</div>';
    return;
  }

  elements.milestones.innerHTML = state.milestones.map((item) => `
    <div class="milestone-item">
      <div class="milestone-name">${escapeHtml(item.name)}</div>
      <div class="milestone-meta">${escapeHtml(item.meta || "Completed")}</div>
    </div>
  `).join("");
}

function renderAchievements() {
  if (!elements.achievements) return;
  if (!state.achievements || !state.achievements.length) {
    elements.achievements.innerHTML = '<div class="empty-state">Your first milestone is waiting.</div>';
    return;
  }

  elements.achievements.innerHTML = state.achievements.map((item) => `
    <div class="achievement-item">
      <div class="achievement-icon">${escapeHtml(item.icon || "★")}</div>
      <div class="achievement-name">${escapeHtml(item.name)}</div>
      <div class="achievement-desc">${escapeHtml(item.desc || "Earned through meaningful progress.")}</div>
    </div>
  `).join("");
}

function renderProjects() {
  if (!elements.projects) return;
  if (!state.projects || !state.projects.length) {
    elements.projects.innerHTML = '<div class="empty-state">Projects will appear here once you publish or complete one.</div>';
    return;
  }

  elements.projects.innerHTML = state.projects.map((project) => `
    <div class="project-item">
      <div class="project-head">
        <div class="project-name">${escapeHtml(project.name)}</div>
        <div class="project-date">${escapeHtml(project.date || "Recent")}</div>
      </div>
      <p class="project-description">${escapeHtml(project.description)}</p>
      <div class="project-links">
        ${project.links && project.links.github ? `<a class="project-link" href="${escapeHtml(project.links.github)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
        ${project.links && project.links.live ? `<a class="project-link" href="${escapeHtml(project.links.live)}" target="_blank" rel="noreferrer">Live Demo</a>` : ""}
      </div>
      <div class="tech-stack">
        ${(project.stack || []).map((tag) => `<span class="tech-pill">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

function renderStats() {
  if (!elements.stats) return;
  elements.stats.innerHTML = (state.stats || []).map((stat) => `
    <div class="stat-box">
      <div class="stat-number">${escapeHtml(String(stat.number || 0))}</div>
      <div class="stat-label">${escapeHtml(stat.label || "")}</div>
    </div>
  `).join("");
}

function renderSkills() {
  if (!elements.skills) return;
  if (!state.skills || !state.skills.length) {
    elements.skills.innerHTML = '<div class="empty-state">Skills will be added from real learning and project activity.</div>';
    return;
  }

  elements.skills.innerHTML = state.skills.map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`).join("");
}

function renderCareer() {
  if (elements.careerDirection) {
    elements.careerDirection.textContent = state.careerDirection || "Still exploring.";
  }

  if (elements.careerInterests) {
    const interests = Array.isArray(state.careerInterests) && state.careerInterests.length ? state.careerInterests : ["Still exploring."];
    elements.careerInterests.innerHTML = interests.map((item) => `<span class="career-tag">${escapeHtml(item)}</span>`).join("");
  }
}

function renderActivity() {
  if (!elements.activity) return;
  if (!state.activity || !state.activity.length) {
    elements.activity.innerHTML = '<div class="empty-state">No learning activity yet. Start your first trail to begin building a history.</div>';
    return;
  }

  elements.activity.innerHTML = state.activity.map((item) => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${escapeHtml(item.text || "Learning activity")}</strong></div>
        <span class="activity-time">${escapeHtml(item.time || "Recent")}</span>
      </div>
    </div>
  `).join("");
}

function openProfileModal() {
  if (!elements.modal || !currentUser) return;
  const fields = {
    displayName: document.getElementById("formDisplayName"),
    username: document.getElementById("formUsername"),
    headline: document.getElementById("formHeadline"),
    degree: document.getElementById("formDegree"),
    college: document.getElementById("formCollege"),
    year: document.getElementById("formYear"),
    location: document.getElementById("formLocation"),
    bio: document.getElementById("formBio"),
    github: document.getElementById("formGithub"),
    linkedin: document.getElementById("formLinkedin"),
    portfolio: document.getElementById("formPortfolio"),
    career: document.getElementById("formCareer"),
    interestTags: document.getElementById("formInterestTags")
  };

  fields.displayName.value = state.displayName || "";
  fields.username.value = state.username || sanitizeUsername(state.displayName || "student");
  fields.headline.value = state.headline || "";
  fields.degree.value = state.degree || "";
  fields.college.value = state.college || "";
  fields.year.value = state.year || "";
  fields.location.value = state.location || "";
  fields.bio.value = state.bio || "";
  fields.github.value = state.socials.github || "";
  fields.linkedin.value = state.socials.linkedin || "";
  fields.portfolio.value = state.socials.portfolio || "";
  fields.career.value = state.careerDirection || "";
  fields.interestTags.value = Array.isArray(state.careerInterests) ? state.careerInterests.join(", ") : "";

  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
}

function closeProfileModal() {
  if (!elements.modal) return;
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
  elements.form?.reset();
}

async function handleProfileSave(event) {
  event.preventDefault();
  if (!currentUser || !db || !auth) {
    setSaveStatus("Sign in before saving profile changes.", true);
    return;
  }
  const form = event.currentTarget;
  const formData = new FormData(form);

  const nextName = String(formData.get("displayName") || "").trim() || state.displayName;
  const nextUsername = String(formData.get("username") || "").trim() || sanitizeUsername(nextName);
  const nextHeadline = String(formData.get("headline") || "").trim();
  const nextDegree = String(formData.get("degree") || "").trim();
  const nextCollege = String(formData.get("college") || "").trim();
  const nextYear = String(formData.get("year") || "").trim();
  const nextLocation = String(formData.get("location") || "").trim();
  const nextBio = String(formData.get("bio") || "").trim();
  const nextGithub = String(formData.get("github") || "").trim();
  const nextLinkedIn = String(formData.get("linkedin") || "").trim();
  const nextPortfolio = String(formData.get("portfolio") || "").trim();
  const nextCareerDirection = String(formData.get("career") || "").trim();
  const nextInterestTags = String(formData.get("interestTags") || "").split(",").map((tag) => tag.trim()).filter(Boolean);

  const avatarFile = document.getElementById("formAvatar")?.files?.[0];
  const bannerFile = document.getElementById("formBanner")?.files?.[0];

  const saveButton = form.querySelector('button[type="submit"]');
  if (saveButton) saveButton.disabled = true;
  setSaveStatus("Saving profile…");
  try {
    validateImage(avatarFile, "Profile picture");
    validateImage(bannerFile, "Banner image");
    const avatarUrl = avatarFile ? await uploadProfileImage(avatarFile, "avatar") : state.avatar;
    const bannerUrl = bannerFile ? await uploadProfileImage(bannerFile, "banner") : state.banner;

    const nextState = {
      ...state,
      displayName: nextName,
      username: nextUsername,
      headline: nextHeadline,
      degree: nextDegree,
      college: nextCollege,
      year: nextYear,
      location: nextLocation,
      bio: nextBio,
      aboutText: nextBio,
      careerDirection: nextCareerDirection,
      careerInterests: nextInterestTags,
      socials: {
        github: nextGithub,
        linkedin: nextLinkedIn,
        portfolio: nextPortfolio
      },
      avatar: avatarUrl || state.avatar,
      banner: bannerUrl || state.banner
    };

    await setDoc(doc(db, "users", currentUser.uid), {
      profile: {
        displayName: nextState.displayName,
        username: nextState.username,
        headline: nextState.headline,
        degree: nextState.degree,
        college: nextState.college,
        year: nextState.year,
        location: nextState.location,
        bio: nextState.bio,
        careerDirection: nextState.careerDirection,
        careerInterests: nextState.careerInterests,
        skills: nextState.skills,
        avatar: nextState.avatar,
        banner: nextState.banner,
        socialLinks: nextState.socials,
        aboutText: nextState.aboutText
      }
    }, { merge: true });
    state = nextState;
    try {
      await updateProfile(currentUser, {
        displayName: nextState.displayName,
        photoURL: nextState.avatar || null
      });
    } catch (error) {
      console.warn("Profile saved to Firestore but Firebase Auth profile could not be synced:", error);
    }
    renderProfile();
    renderAuthNavigation();
    setSaveStatus("Profile saved.");
    closeProfileModal();
  } catch (error) {
    console.error("Failed to save profile:", error);
    setSaveStatus(`Could not save your profile: ${error.message || "Please try again."}`, true);
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

async function uploadProfileImage(file, type) {
  if (!file) return "";
  if (!auth || !currentUser || !storage) throw new Error("Image storage is unavailable. Please try again later.");
  const fileRef = ref(storage, `profileImages/${currentUser.uid}/${type}`);
  const uploadResult = await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(uploadResult.ref);
}

function validateImage(file, label) {
  if (!file) return;
  if (!file.type.startsWith("image/")) throw new Error(`${label} must be an image file.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${label} must be 5 MB or smaller.`);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function setSaveStatus(message, isError = false) {
  if (!elements.saveStatus) return;
  elements.saveStatus.textContent = message;
  elements.saveStatus.dataset.error = String(isError);
}

function initialsFor(name) {
  const clean = String(name || "Student").trim();
  if (!clean) return "S";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("").slice(0, 2) || "S";
}

function sanitizeUsername(value) {
  const clean = (value || "student").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return clean || "student";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
