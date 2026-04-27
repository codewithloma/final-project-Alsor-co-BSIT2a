// ============================================================
//  DearBUP – profile.js
//  IT 112 – 2A | AlSor Co | AY 2025-2026
//
//  Backend contract:
//    GET  /api/profile          → getProfile   (authMiddleware)
//    PUT  /api/profile          → updateProfile (authMiddleware)
//    Body for PUT: { display_name, bio, avatar_url }
//
//  Posts routes expected (add to your router):
//    GET  /api/posts?author=<id>   → user's posts
//    POST /api/posts/:id/like      → toggle like
// ============================================================

"use strict";

// ── Config ────────────────────────────────────────────────
const API_BASE  = "http://localhost:5000/api";
const INDEX_URL = "../index.html"; // Adjust to your actual login/landing page path

const CLOUDINARY_CLOUD  = "dqu4ypjhb";
const CLOUDINARY_PRESET = "DearBUP"; 

let _badgePollInterval = null;
// ── Auth ──────────────────────────────────────────────────
const getToken = () => localStorage.getItem("dearbup_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Redirect if not logged in ─────────────────────────────
(function guardAuth() {
  if (!getToken()) {
    window.location.href = INDEX_URL;
  }
})();

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = ["toast", "show", type].filter(Boolean).join(" ");
  setTimeout(() => (el.className = "toast"), 3200);
}

// ── Utilities ─────────────────────────────────────────────
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name[0] || "?").toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hrs   = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}
// ── API calls ─────────────────────────────────────────────

/**
 * GET /api/profile
 * Returns the logged-in user's full document (minus password).
 * Fields used: _id, username, display_name, email, student_id,
 *              bio, avatar_url, course, year, user_type, createdAt
 */
async function apiGetProfile() {
  const res = await fetch(`${API_BASE}/profile`, { headers: authHeaders() });
  if (res.status === 401) {
    localStorage.removeItem("dearbup_token");
    window.location.href = INDEX_URL;
    return null;
  }
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  return res.json();
}

/**
 * PUT /api/profile
 * Body: { display_name, bio, avatar_url }
 * Returns: { message, user }
 */
async function apiUpdateProfile(payload) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Update failed (${res.status})`);
  // Controller returns { message, user } — extract user
  return data.user ?? data;
}

/**
 * GET /api/posts?author=<userId>
 * Returns array of post objects.
 * Expected fields per post: _id, content, likes_count,
 *                           comments_count, liked_by_me, created_at
 */
async function apiGetUserPosts(userId) {
  const res = await fetch(`${API_BASE}/posts?author=${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Posts fetch failed (${res.status})`);
  const data = await res.json();
  // Normalise: support both { posts: [] } and []
  return Array.isArray(data) ? data : (data.posts ?? []);
}

/**
 * POST /api/posts/:id/like
 * Returns: { liked: Boolean, likes_count: Number }
 */
async function apiToggleLike(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Like failed (${res.status})`);
  return res.json();
}

// ── Sidebar ───────────────────────────────────────────────
function populateSidebar(user) {
  const initials = getInitials(user.display_name || user.username);
  const av = document.getElementById("sidebarAvatar");
  const nm = document.getElementById("sidebarName");
  const cr = document.getElementById("sidebarCourse");
  if (av) {
    if (user.avatar_url) {
      av.innerHTML = `<img src="${escapeHTML(user.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      av.textContent = initials;
    }
  }
  if (nm) nm.textContent = user.display_name || user.username || "User";
  if (cr) cr.textContent = user.course || "";
}

// ── Render profile header ─────────────────────────────────
function renderProfile(user) {
  const displayName = user.display_name || user.username || "Unknown";
  const handle      = `@${user.username || displayName.toLowerCase().replace(/\s+/g, "")}`;
  const initials    = getInitials(displayName);

  const avatarEl = document.getElementById("profileAvatar");
  if (avatarEl) {
    if (user.avatar_url) {
      avatarEl.innerHTML = `<img src="${escapeHTML(user.avatar_url)}" alt="${escapeHTML(displayName)}" />`;
    } else {
      avatarEl.textContent = initials;
    }
  }

  const dnEl  = document.getElementById("profileDisplayName");
  const hdEl  = document.getElementById("profileHandle");
  const bioEl = document.getElementById("profileBio");
  if (dnEl)  dnEl.textContent  = displayName;
  if (hdEl)  hdEl.textContent  = handle;
  if (bioEl) bioEl.textContent = user.bio || "No bio yet. Tell the BUP community something about yourself!";

  const badgesEl = document.getElementById("profileBadges");
  if (badgesEl) {
    badgesEl.innerHTML = [
      user.course
        ? `<span class="badge badge-course"><i class="fas fa-graduation-cap"></i> ${escapeHTML(user.course)}</span>`
        : "",
      user.year
        ? `<span class="badge badge-year">${escapeHTML(user.year)}</span>`
        : "",
      `<span class="badge badge-verified"><i class="fas fa-check-circle"></i> BU Polangui</span>`,
    ].join("");
  }
}

// ── Render stats ──────────────────────────────────────────
function renderStats(postsCount, totalLikes) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";
  };
  set("statPosts", postsCount);
  set("statLikes", totalLikes);
}

// ── Render posts tab ──────────────────────────────────────
function renderPosts(posts, user) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  if (!posts.length) {
    container.innerHTML = `
      <div class="feed-empty">
        <i class="fas fa-feather-alt"></i>
        <p>No posts yet. Share something with the BUP community!</p>
      </div>`;
    return;
  }

  const authorName  = user.display_name || user.username || "You";
  const authorInits = getInitials(authorName);

  container.innerHTML = posts.map((p, i) => `
    <div class="post-card" style="animation-delay:${i * 0.06}s">
      <div class="post-card-header">
        <div class="pc-avatar">
          ${user.avatar_url
            ? `<img src="${escapeHTML(user.avatar_url)}" alt="" />`
            : authorInits}
        </div>
        <div class="pc-meta">
          <div class="name">${escapeHTML(authorName)}</div>
          <div class="time">${timeAgo(p.created_at || p.createdAt)}</div>
        </div>
      </div>
      <div class="post-card-body">${formatContent(p.content)}</div>

      ${p.spotify_track_url ? `
        <div class="post-spotify-embed" style="margin: 12px 0; border-radius: 12px; overflow: hidden;">
          <iframe
            src="https://open.spotify.com/embed/track/${extractSpotifyId(p.spotify_track_url)}"
            width="100%"
            height="80"
            frameborder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style="border-radius: 12px; display: block;">
          </iframe>
        </div>` : ""}

      <div class="post-card-footer">
        <button
          class="pc-action ${p.liked_by_me ? "liked" : ""}"
          data-action="like"
          data-post-id="${p._id}"
          data-liked="${p.liked_by_me ? "1" : "0"}">
          <i class="fas fa-heart"></i>
          <span class="like-count">${p.likes_count ?? 0}</span>
        </button>
        <button class="pc-action" data-action="comment" data-post-id="${p._id}">
          <i class="fas fa-comment"></i> ${p.comments_count ?? 0}
        </button>
        <button class="pc-action" data-action="share" data-post-id="${p._id}">
          <i class="fas fa-share"></i>
        </button>
      </div>
    </div>`).join("");

  container.querySelectorAll('[data-action="like"]').forEach((btn) =>
    btn.addEventListener("click", () => handleLike(btn))
  );
}

// ← ADD THIS right after renderPosts, before formatContent
function extractSpotifyId(url = "") {
  if (!url) return "";
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : "";
}

function formatContent(text = "") {
  return escapeHTML(text).replace(/#(\w+)/g,
    '<span class="hashtag">#$1</span>'
  );
}

// ── Render about tab ──────────────────────────────────────
function renderAbout(user) {
  const container = document.getElementById("aboutContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="about-card" style="animation-delay:0s">
      <h3>Personal Info</h3>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-user"></i></div>
        <div class="info-text">
          <div class="label">Display Name</div>
          <div class="value">${escapeHTML(user.display_name || user.username || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-at"></i></div>
        <div class="info-text">
          <div class="label">Username</div>
          <div class="value">@${escapeHTML(user.username || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-envelope"></i></div>
        <div class="info-text">
          <div class="label">Email</div>
          <div class="value">${escapeHTML(user.email || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-id-badge"></i></div>
        <div class="info-text">
          <div class="label">Student ID</div>
          <div class="value">${escapeHTML(user.student_id || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-shield-alt"></i></div>
        <div class="info-text">
          <div class="label">Role</div>
          <div class="value" style="text-transform:capitalize">${escapeHTML(user.user_type || "student")}</div>
        </div>
      </div>
    </div>

    <div class="about-card" style="animation-delay:0.07s">
      <h3>Academic Info</h3>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-graduation-cap"></i></div>
        <div class="info-text">
          <div class="label">Course</div>
          <div class="value">${escapeHTML(user.course || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-layer-group"></i></div>
        <div class="info-text">
          <div class="label">Year Level</div>
          <div class="value">${escapeHTML(user.year || "—")}</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-university"></i></div>
        <div class="info-text">
          <div class="label">Campus</div>
          <div class="value">Bicol University – Polangui</div>
        </div>
      </div>
      <div class="info-row">
        <div class="info-icon"><i class="fas fa-calendar-check"></i></div>
        <div class="info-text">
          <div class="label">Member Since</div>
          <div class="value">${formatDate(user.createdAt || user.created_at)}</div>
        </div>
      </div>
    </div>`;
}

// ── Like handler ──────────────────────────────────────────
async function handleLike(btn) {
  const postId   = btn.dataset.postId;
  const wasLiked = btn.dataset.liked === "1";
  const countEl  = btn.querySelector(".like-count");
  const prev     = parseInt(countEl.textContent, 10) || 0;

  // Optimistic update
  btn.classList.toggle("liked");
  btn.dataset.liked   = wasLiked ? "0" : "1";
  countEl.textContent = wasLiked ? prev - 1 : prev + 1;

  try {
    const result = await apiToggleLike(postId);
    // Sync with server truth
    countEl.textContent = result.likes_count;
    btn.dataset.liked   = result.liked ? "1" : "0";
    result.liked ? btn.classList.add("liked") : btn.classList.remove("liked");
  } catch {
    // Revert on error
    btn.classList.toggle("liked");
    btn.dataset.liked   = wasLiked ? "1" : "0";
    countEl.textContent = prev;
    showToast("Could not update like. Try again.", "error");
  }
}

// ── Tabs ──────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("active");
    });
  });

  // Click on stat post count to jump to posts tab
  document.getElementById("statPostsBtn")?.addEventListener("click", () =>
    document.querySelector('[data-tab="posts"]')?.click()
  );
}

// ── Edit Profile Modal ────────────────────────────────────
let _currentUser = null;

function openEditModal() {
  if (!_currentUser) return;
  document.getElementById("editDisplayName").value = _currentUser.display_name || "";
  document.getElementById("editBioInput").value    = _currentUser.bio || "";
  document.getElementById("editAvatarUrl").value   = _currentUser.avatar_url || "";
  updateBioCount();

  // Show current avatar in preview
  const preview = document.getElementById("avatarPreview");
  if (preview) {
    if (_currentUser.avatar_url) {
      preview.innerHTML = `<img src="${escapeHTML(_currentUser.avatar_url)}" alt="" />`;
    } else {
      preview.textContent = getInitials(_currentUser.display_name || _currentUser.username);
    }
  }

  // Wire file picker
  const fileInput = document.getElementById("avatarFileInput");
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show instant preview before upload
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (preview) preview.innerHTML = `<img src="${ev.target.result}" alt="" />`;
      };
      reader.readAsDataURL(file);

      fileInput._pendingFile = file;
      const hint = document.getElementById("avatarUploadHint");
      if (hint) hint.textContent = file.name;
    };
  }

  document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
}

function updateBioCount() {
  const val = document.getElementById("editBioInput")?.value || "";
  const el  = document.getElementById("bioCharCount");
  if (el) el.textContent = val.length;
}

async function saveProfile() {
  const saveBtn = document.getElementById("saveProfileBtn");
  if (!saveBtn) return;

  saveBtn.disabled  = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

  try {
    const fileInput   = document.getElementById("avatarFileInput");
    const pendingFile = fileInput?._pendingFile;

    // If new photo selected, upload to Cloudinary first
    if (pendingFile) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading photo…';
      const imageUrl = await uploadToCloudinary(pendingFile);
      document.getElementById("editAvatarUrl").value = imageUrl;
      fileInput._pendingFile = null;
    }

    const payload = {
      display_name: document.getElementById("editDisplayName").value.trim(),
      bio:          document.getElementById("editBioInput").value.trim(),
      avatar_url:   document.getElementById("editAvatarUrl").value.trim(),
    };

    localStorage.setItem("dearbup_user", JSON.stringify(_currentUser));

    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
    const updatedUser = await apiUpdateProfile(payload);
    _currentUser = { ..._currentUser, ...updatedUser };

    localStorage.setItem("dearbup_user", JSON.stringify(_currentUser));

    renderProfile(_currentUser);
    populateSidebar(_currentUser);
    renderAbout(_currentUser);
    closeEditModal();
    showToast("Profile updated! ✨", "success");

  } catch (err) {
    showToast(err.message || "Could not save profile.", "error");
  } finally {
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
  }
}

// ── Logout ────────────────────────────────────────────────
function initLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("dearbup_token");
    window.location.href = INDEX_URL;
  });
}

// ── Mobile sidebar ────────────────────────────────────────
function initMobileNav() {
  document.getElementById("menuToggle")?.addEventListener("click", () =>
    document.getElementById("sidebar")?.classList.toggle("active")
  );
}

// ── Share profile link ────────────────────────────────────
function initShareBtn() {
  document.getElementById("shareProfileBtn")?.addEventListener("click", () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url)
      .then(() => showToast("Profile link copied! 🔗"))
      .catch(() => showToast("Link: " + url));
  });
}

// ── Cover / avatar placeholders ───────────────────────────
function initCoverBtn() {
  document.getElementById("editCoverBtn")?.addEventListener("click", () =>
    showToast("Cover photo upload coming soon!")
  );
  document.getElementById("avatarEditBtn")?.addEventListener("click", () =>
    showToast("Photo upload coming soon!")
  );
}

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initTabs();
  initLogout();
  initMobileNav();
  initShareBtn();
  initCoverBtn();

  // Wire edit modal open/close
  document.getElementById("editProfileBtn")?.addEventListener("click", openEditModal);
  document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
  document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);
  document.getElementById("saveProfileBtn")?.addEventListener("click", saveProfile);

  // Close modal on backdrop click
  document.getElementById("editModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });

  // Bio char counter
  document.getElementById("editBioInput")?.addEventListener("input", updateBioCount);

  // ── Load profile from backend ──────────────────────────
  try {
    const user = await apiGetProfile();
    if (!user) return; // redirected to login by apiGetProfile

    _currentUser = user;

    renderProfile(user);
    populateSidebar(user);
    renderAbout(user);

    // ── Load user posts from backend ───────────────────
    try {
      const posts = await apiGetUserPosts(user._id);
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
      renderStats(posts.length, totalLikes);
      renderPosts(posts, user);
    } catch (postsErr) {
      console.error("Failed to load posts:", postsErr);
      renderStats(0, 0);
      renderPosts([], user);
      showToast("Could not load posts.", "error");
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
    showToast("Could not load profile. Please try again.", "error");
  }
});
async function initNotificationBadge() {
  const token = getToken();
  const badge = document.getElementById("notificationBadge");
  if (!token || !badge) return;

  try {
    const res = await fetch(`${API_BASE}/notifications/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;

    const { unreadCount } = await res.json();

    if (unreadCount > 0) {
      badge.textContent   = unreadCount > 99 ? "99+" : String(unreadCount);
      badge.style.display = "inline-flex";
    } else {
      badge.textContent   = "";
      badge.style.display = "none"; // ← only change from your original
    }
  } catch (err) {
    console.warn("Badge fetch failed:", err);
  }
}

// Call it on load, then repeat every 30s
document.addEventListener("DOMContentLoaded", () => {
  initNotificationBadge();
  setInterval(initNotificationBadge, 3000);
});