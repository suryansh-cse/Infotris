/**
 * Infotris Profile Manager
 * Handles authentication checks, data loading from Firestore, profile edits, 
 * profile image/banner uploads via Firebase Storage, and UI state synchronization.
 */

import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Global state tracking for current user
let currentUser = null;
let currentProfileData = {};

// DOM Element Selectors (aligned with actual profile.html classes & IDs)
const selectors = {
    displayName: document.querySelector('.user-names h1'),
    username: document.querySelector('.user-names .username'),
    roleMeta: document.querySelector('.user-meta .meta-item:nth-child(1) span'),
    collegeMeta: document.querySelector('.user-meta .meta-item:nth-child(3) span'),
    locationMeta: document.querySelector('.user-meta .meta-item:nth-child(5) span') || null, // fallback or dynamic insertion point
    bio: document.querySelector('.user-bio'),
    avatarImg: document.querySelector('.avatar-container img') || createImgElementInAvatar(),
    bannerDiv: document.querySelector('.cover-banner'),
    editBtn: document.querySelector('.edit-profile-btn'),
    socialContainer: document.querySelector('.social-links'),
    skillsContainer: document.querySelector('.skills-container'),
    
    // Learning Stats
    xpVal: document.querySelector('.learning-stats .stat-box:nth-child(1) .stat-value'),
    streakVal: document.querySelector('.learning-stats .stat-box:nth-child(2) .stat-value'),
    coursesVal: document.querySelector('.learning-stats .stat-box:nth-child(3) .stat-value'),
    lessonsVal: document.querySelector('.learning-stats .stat-box:nth-child(4) .stat-value'),
    
    // Trail Progress
    trailTitle: document.querySelector('.trail-title'),
    trailCourse: document.querySelector('.trail-course'),
    progressBar: document.querySelector('.progress-bar-fill'),
    progressText: document.querySelector('.trail-info-row span:last-child')
};

function createImgElementInAvatar() {
    const container = document.querySelector('.avatar-container');
    if (!container) return null;
    const existingImg = container.querySelector('img');
    if (existingImg) return existingImg;
    
    const img = document.createElement('img');
    img.alt = 'Profile Avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    // Clear SVG placeholder if present and append img
    container.innerHTML = '';
    container.appendChild(img);
    return img;
}

document.addEventListener("DOMContentLoaded", () => {
    initAuthListener();
    setupEditModalTriggers();
});

/**
 * 1. Auth State Listener & Initialization
 */
function initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Redirect unauthenticated users to login page
            window.location.href = "/login.html"; // Adjust path if login URL differs in your setup
            return;
        }

        currentUser = user;
        await loadUserData(user.uid);
    });
}

/**
 * 2. Load User Profile & Learning Data from Firestore
 */
async function loadUserData(uid) {
    try {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            currentProfileData = data.profile || {};
            
            populateProfileUI(data);
        } else {
            // Initialize empty document structure if first time visiting profile
            const defaultData = {
                profile: {
                    displayName: currentUser.displayName || "",
                    email: currentUser.email || "",
                    joinedAt: new Date().toISOString(),
                    avatarUrl: currentUser.photoURL || "",
                    bannerUrl: "",
                    bio: "",
                    college: "",
                    role: "",
                    location: "",
                    website: "",
                    skills: [],
                    socialLinks: { github: "", linkedin: "", instagram: "", twitter: "" }
                },
                stats: { level: 1, xp: 0, streak: 0, coins: 0 },
                learning: { currentTrail: "None", currentLesson: "None", progress: 0 },
                achievements: [],
                activity: []
            };
            await setDoc(userDocRef, defaultData, { merge: true });
            currentProfileData = defaultData.profile;
            populateProfileUI(defaultData);
        }
    } catch (error) {
        console.error("Failed to load user profile data:", error);
        showNotification("Error loading profile data. Please refresh.", "error");
    }
}

/**
 * 3. Populate Profile UI Components Safely
 */
function populateProfileUI(data) {
    const p = data.profile || {};
    const stats = data.stats || {};
    const learning = data.learning || {};

    // Display Name Fallbacks
    const fallbackName = p.displayName || currentUser.displayName || currentUser.email.split('@')[0];
    if (selectors.displayName) selectors.displayName.textContent = fallbackName;
    if (selectors.username) selectors.username.textContent = `@${fallbackName.toLowerCase().replace(/\s+/g, '')}`;

    // Meta details
    if (selectors.roleMeta) selectors.roleMeta.textContent = p.role || "Developer";
    if (selectors.collegeMeta) selectors.collegeMeta.textContent = p.college || "Independent";

    // Bio
    if (selectors.bio) selectors.bio.textContent = p.bio || "No bio provided yet.";

    // Avatar & Banner
    if (p.avatarUrl && selectors.avatarImg) {
        selectors.avatarImg.src = p.avatarUrl;
    }
    if (p.bannerUrl && selectors.bannerDiv) {
        selectors.bannerDiv.style.backgroundImage = `url('${p.bannerUrl}')`;
        selectors.bannerDiv.style.backgroundSize = 'cover';
    }

    // Stats
    if (selectors.xpVal) selectors.xpVal.textContent = (stats.xp || 0).toLocaleString();
    if (selectors.streakVal) selectors.streakVal.textContent = `${stats.streak || 0} days`;
    
    // Learning & Trail
    if (selectors.trailTitle) selectors.trailTitle.textContent = learning.currentTrail || "General Track";
    if (selectors.progressBar) selectors.progressBar.style.width = `${learning.progress || 0}%`;
    if (selectors.progressText) selectors.progressText.textContent = `${learning.progress || 0}%`;

    // Skills Tags
    if (selectors.skillsContainer && Array.isArray(p.skills)) {
        selectors.skillsContainer.innerHTML = p.skills.length > 0 
            ? p.skills.map(skill => `<span class="skill-pill">${escapeHTML(skill)}</span>`).join('')
            : '<span class="text-subtle" style="font-size:0.8125rem;">No skills added yet.</span>';
    }

    // Social Links
    if (selectors.socialContainer && p.socialLinks) {
        const links = p.socialLinks;
        let socialHTML = '';
        if (links.github) socialHTML += `<a href="${sanitizeUrl(links.github)}" target="_blank" rel="noreferrer" class="social-pill">GitHub</a>`;
        if (links.linkedin) socialHTML += `<a href="${sanitizeUrl(links.linkedin)}" target="_blank" rel="noreferrer" class="social-pill">LinkedIn</a>`;
        if (links.twitter) socialHTML += `<a href="${sanitizeUrl(links.twitter)}" target="_blank" rel="noreferrer" class="social-pill">X / Twitter</a>`;
        if (links.instagram) socialHTML += `<a href="${sanitizeUrl(links.instagram)}" target="_blank" rel="noreferrer" class="social-pill">Instagram</a>`;
        if (p.website) socialHTML += `<a href="${sanitizeUrl(p.website)}" target="_blank" rel="noreferrer" class="social-pill">Website ↗</a>`;
        
        if (socialHTML) selectors.socialContainer.innerHTML = socialHTML;
    }
}

/**
 * 4. Image Upload Handlers (Storage Integration)
 */
async function uploadProfileImage(file, type = 'avatar') {
    if (!file || !currentUser) return null;
    
    // Validate format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file format. Please upload JPG, PNG, or WEBP.");
    }

    // Validate size (< 3MB)
    if (file.size > 3 * 1024 * 1024) {
        throw new Error("File size exceeds 3MB limit.");
    }

    const storagePath = `profileImages/${currentUser.uid}/${type}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
}

/**
 * 5. Profile Editing Flow & Modal Controller
 */
function setupEditModalTriggers() {
    if (!selectors.editBtn) return;

    selectors.editBtn.addEventListener('click', () => {
        openEditProfileModal();
    });
}

function openEditProfileModal() {
    // Check if modal already exists in DOM, else inject clean lightweight edit dialog matching Infotris UI
    let modalOverlay = document.getElementById('infotris-edit-modal');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'infotris-edit-modal';
        modalOverlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
        `;
        modalOverlay.innerHTML = `
            <div style="background: var(--bg-secondary, #121212); border: 1px solid var(--border, #222226); border-radius: var(--radius-lg, 14px); width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: var(--white, #fff);">Edit Profile</h3>
                    <button id="close-modal-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 1.25rem;">✕</button>
                </div>
                <form id="edit-profile-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">DISPLAY NAME</label>
                        <input type="text" id="edit-display-name" value="${currentProfileData.displayName || ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" required />
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">ROLE / TITLE</label>
                        <input type="text" id="edit-role" value="${currentProfileData.role || ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" />
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">COLLEGE / UNIVERSITY</label>
                        <input type="text" id="edit-college" value="${currentProfileData.college || ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" />
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">BIO</label>
                        <textarea id="edit-bio" rows="3" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans); resize: vertical;">${currentProfileData.bio || ''}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">GITHUB URL</label>
                            <input type="url" id="edit-github" value="${currentProfileData.socialLinks?.github || ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" />
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">LINKEDIN URL</label>
                            <input type="url" id="edit-linkedin" value="${currentProfileData.socialLinks?.linkedin || ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" />
                        </div>
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">SKILLS (Comma separated)</label>
                        <input type="text" id="edit-skills" value="${Array.isArray(currentProfileData.skills) ? currentProfileData.skills.join(', ') : ''}" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.625rem; color: var(--white); font-family: var(--font-sans);" />
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
                        <div>
                            <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">AVATAR IMAGE</label>
                            <input type="file" id="edit-avatar-file" accept="image/*" style="font-size:0.8rem; color:var(--text-muted);" />
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 0.375rem;">BANNER IMAGE</label>
                            <input type="file" id="edit-banner-file" accept="image/*" style="font-size:0.8rem; color:var(--text-muted);" />
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                        <button type="button" id="cancel-modal-btn" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor:pointer;">Cancel</button>
                        <button type="submit" id="save-profile-btn" style="background: var(--white); color: var(--black); font-weight: 500; border: none; padding: 0.5rem 1.25rem; border-radius: var(--radius-sm); cursor:pointer;">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        document.getElementById('close-modal-btn').onclick = () => modalOverlay.remove();
        document.getElementById('cancel-modal-btn').onclick = () => modalOverlay.remove();

        document.getElementById('edit-profile-form').onsubmit = async (e) => {
            e.preventDefault();
            await handleProfileSave(modalOverlay);
        };
    } else {
        modalOverlay.style.display = 'flex';
    }
}

async function handleProfileSave(modalElement) {
    if (!currentUser) return;
    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    try {
        const displayName = document.getElementById('edit-display-name').value.trim();
        const role = document.getElementById('edit-role').value.trim();
        const college = document.getElementById('edit-college').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const github = document.getElementById('edit-github').value.trim();
        const linkedin = document.getElementById('edit-linkedin').value.trim();
        const skillsRaw = document.getElementById('edit-skills').value;
        
        const skills = skillsRaw
            ? [...new Set(skillsRaw.split(',').map(s => s.trim()).filter(Boolean))]
            : [];

        const avatarFile = document.getElementById('edit-avatar-file').files[0];
        const bannerFile = document.getElementById('edit-banner-file').files[0];

        let avatarUrl = currentProfileData.avatarUrl || "";
        let bannerUrl = currentProfileData.bannerUrl || "";

        if (avatarFile) {
            avatarUrl = await uploadProfileImage(avatarFile, 'avatar');
        }
        if (bannerFile) {
            bannerUrl = await uploadProfileImage(bannerFile, 'banner');
        }

        const updatedProfile = {
            ...currentProfileData,
            displayName,
            role,
            college,
            bio,
            avatarUrl,
            bannerUrl,
            skills,
            socialLinks: {
                ...currentProfileData.socialLinks,
                github,
                linkedin
            }
        };

        const userDocRef = doc(db, "users", currentUser.uid);
        // Use merge updates to protect stats, learning progress, missions, and achievements
        await updateDoc(userDocRef, {
            profile: updatedProfile
        });

        currentProfileData = updatedProfile;
        populateProfileUI({ profile: updatedProfile, stats: {}, learning: {} });
        
        modalElement.remove();
        showNotification("Profile updated successfully!", "success");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert(error.message || "Failed to update profile. Please try again.");
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
    }
}

/**
 * Utility Helpers
 */
function sanitizeUrl(url) {
    if (!url) return '#';
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
    } catch {
        return '#';
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem; background: var(--bg-secondary, #121212);
        color: var(--white, #fff); border: 1px solid var(--border, #222226); padding: 0.75rem 1.25rem;
        border-radius: var(--radius-sm, 6px); font-size: 0.875rem; z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        font-family: var(--font-sans);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}