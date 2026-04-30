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
  const hrs   = Math.floor(diff / 3_360_000); // Corrected from 3_600_000 for logic consistency
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

async function uploadToServer(file) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const res = await fetch(`${API_BASE}/upload/avatar`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            image: reader.result
          }),
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Server returned non-JSON:", text);
          throw new Error("Server returned invalid response");
        }

        if (!res.ok) {
          throw new Error(data.message || "Upload failed");
        }

        resolve(data.imageUrl);
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsDataURL(file);
  });
}
// ── API calls ─────────────────────────────────────────────

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

async function apiUpdateProfile(payload) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Update failed (${res.status})`);
  return data.user ?? data;
}

async function apiGetUserPosts(userId) {
  const res = await fetch(`${API_BASE}/posts?author=${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Posts fetch failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.posts ?? []);
}

async function apiToggleLike(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/react`, {
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

  container.innerHTML = posts.map((p, i) => {

    let spotifyHtml = '';
    if (p.spotify_track_url && !p.shared_from) {
      const id = extractSpotifyId(p.spotify_track_url);
      if (id) spotifyHtml = `
        <div class="post-spotify-embed" style="margin:12px 0;border-radius:12px;overflow:hidden;">
          <iframe src="https://open.spotify.com/embed/track/${id}"
            width="100%" height="80" frameborder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" style="border-radius:12px;display:block;"></iframe>
        </div>`;
    }

    let sharedHtml = '';
    if (p.shared_from && p.shared_from._id) {
      const orig     = p.shared_from;
      const origUser = orig.user_id;
      const origName = origUser?.display_name || origUser?.username || 'Someone';
      const origAvatar = origUser?.avatar_url
        ? `<img src="${escapeHTML(origUser.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : origName.charAt(0).toUpperCase();

      let origSpotify = '';
      if (orig.spotify_track_url) {
        const id = extractSpotifyId(orig.spotify_track_url);
        if (id) origSpotify = `
          <div style="margin-top:10px;border-radius:12px;overflow:hidden;">
            <iframe src="https://open.spotify.com/embed/track/${id}"
              width="100%" height="80" frameborder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style="border-radius:12px;display:block;"></iframe>
          </div>`;
      }

      sharedHtml = `
        <div class="shared-post-card">
          <div class="shared-post-header">
            <div class="shared-post-avatar">${origAvatar}</div>
            <div class="shared-post-meta">
              <div class="shared-post-author">${escapeHTML(origName)}</div>
              <div class="shared-post-time">${timeAgo(orig.createdAt || orig.created_at)}</div>
            </div>
          </div>
          ${orig.content ? `<div class="shared-post-content">${formatContent(orig.content)}</div>` : ''}
          ${origSpotify}
        </div>`;
    }

    return `
    <div class="post-card" data-post-id="${p._id}" style="animation-delay:${i * 0.06}s">
      <div class="post-card-header">
        <div class="pc-avatar">
          ${user.avatar_url ? `<img src="${escapeHTML(user.avatar_url)}" alt="" />` : authorInits}
        </div>
        <div class="pc-meta">
          <div class="name">${escapeHTML(authorName)}</div>
          <div class="time">${timeAgo(p.createdAt || p.created_at)}</div>
        </div>
        <div class="post-menu" style="position:relative;margin-left:auto;">
          <button class="post-menu-btn" data-menu="${p._id}">
            <i class="fas fa-ellipsis-h"></i>
          </button>
          <div class="post-menu-dropdown" id="menu-${p._id}">
            <a href="#" data-action="edit" data-post-id="${p._id}">
              <i class="fas fa-pen"></i> Edit post
            </a>
            <a href="#" data-action="delete" data-post-id="${p._id}">
              <i class="fas fa-trash-alt"></i> Delete post
            </a>
          </div>
        </div>
      </div>
      ${p.content ? `<div class="post-card-body">${formatContent(p.content)}${p.edited ? ' <span class="edited-tag">(edited)</span>' : ''}</div>` : ''}
      ${spotifyHtml}
      ${sharedHtml}
      <div class="post-card-footer">
        <button class="pc-action ${p.liked_by_me ? "liked" : ""}"
          data-action="like" data-post-id="${p._id}" data-liked="${p.liked_by_me ? "1" : "0"}">
          <i class="${p.liked_by_me ? 'fas' : 'far'} fa-heart"></i>
          <span class="like-count">${p.likes_count ?? 0}</span>
        </button>
        <button class="pc-action" data-action="comment" data-post-id="${p._id}">
          <i class="far fa-comment"></i>
          <span>${p.comments_count ?? 0}</span>
        </button>
        <button class="pc-action" data-action="share" data-post-id="${p._id}">
          <i class="fas fa-share"></i>
          <span>${p.shares_count ?? 0}</span>
        </button>
      </div>
    </div>`;
  }).join("");

  // Like buttons
  container.querySelectorAll('[data-action="like"]').forEach((btn) =>
    btn.addEventListener("click", () => handleLike(btn))
  );

  // Comment buttons
  container.querySelectorAll('[data-action="comment"]').forEach((btn) =>
    btn.addEventListener("click", () => openCommentModal(btn.dataset.postId))
  );

  // Share buttons
  container.querySelectorAll('[data-action="share"]').forEach((btn) =>
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.postId;
      const res    = await fetch(`${API_BASE}/posts/${postId}`, { headers: authHeaders() });
      const post   = res.ok ? await res.json() : {};
      openProfileShareModal(postId, post);
    })
  );

  // Menu toggles
  container.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuId   = btn.dataset.menu;
      const dropdown = document.getElementById(`menu-${menuId}`);
      document.querySelectorAll('.post-menu-dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown?.classList.toggle('open');
    });
  });

  // Edit/Delete actions
  container.querySelectorAll('.post-menu-dropdown a').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId  = btn.dataset.postId;
      const action  = btn.dataset.action;
      const postEl  = container.querySelector(`[data-post-id="${postId}"]`);

      document.querySelectorAll('.post-menu-dropdown.open').forEach(d => d.classList.remove('open'));

      if (action === 'edit') {
        const contentEl = postEl?.querySelector('.post-card-body');
        openProfileEditModal(postId, contentEl?.innerText || '', postEl);
      } else if (action === 'delete') {
        openProfileDeleteModal(postId, postEl);
      }
    });
  });

  // Close menus when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.post-menu-dropdown.open').forEach(d => d.classList.remove('open'));
  });
}
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
  countEl.textContent = wasLiked ? Math.max(0, prev - 1) : prev + 1;

 try {
    const result = await apiToggleLike(postId);
    const newCount = result.reactions ?? 0;
    const isNowLiked = !wasLiked;
    countEl.textContent = newCount;
    btn.dataset.liked   = isNowLiked ? "1" : "0";
    isNowLiked ? btn.classList.add("liked") : btn.classList.remove("liked");
    const iconEl = btn.querySelector('i');
    if (iconEl) iconEl.className = isNowLiked ? 'fas fa-heart' : 'far fa-heart';
  }catch {
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

  const preview = document.getElementById("avatarPreview");
  if (preview) {
    if (_currentUser.avatar_url) {
      preview.innerHTML = `<img src="${escapeHTML(_currentUser.avatar_url)}" alt="" />`;
    } else {
      preview.textContent = getInitials(_currentUser.display_name || _currentUser.username);
    }
  }

  const fileInput = document.getElementById("avatarFileInput");
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

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

    if (pendingFile) {
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading photo…';
      const imageUrl = await uploadToServer(pendingFile);
      document.getElementById("editAvatarUrl").value = imageUrl;
      fileInput._pendingFile = null;
    }

    const payload = {
      display_name: document.getElementById("editDisplayName").value.trim(),
      bio:           document.getElementById("editBioInput").value.trim(),
      avatar_url:    document.getElementById("editAvatarUrl").value.trim(),
    };

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

// ── Profile Share Modal ───────────────────────────────────
function openProfileShareModal(postId, post) {
  // Reuse home's share modal structure but post to same API
  const modal = document.getElementById('shareModal');
  if (!modal) { showToast('Share feature not available here.'); return; }
  // fallback — just share directly
  fetch(`${API_BASE}/posts/${postId}/share`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ caption: '' })
  }).then(r => {
    if (r.ok) {
      showToast('Post shared! ✨', 'success');
      const shareBtn = document.querySelector(`[data-action="share"][data-post-id="${postId}"] span`);
      if (shareBtn) shareBtn.textContent = parseInt(shareBtn.textContent || '0') + 1;
    }
  }).catch(() => showToast('Failed to share', 'error'));
}

// ── Profile Edit Post Modal ───────────────────────────────
let _editingPostId  = null;
let _editingPostEl  = null;

function openProfileEditModal(postId, currentContent, postEl) {
  _editingPostId = postId;
  _editingPostEl = postEl;

  const modal    = document.getElementById('editPostModal');
  const textarea = document.getElementById('editPostContent');
  const counter  = document.getElementById('editPostCharCount');

  if (!modal || !textarea) return;
  textarea.value           = currentContent;
  if (counter) counter.textContent = currentContent.length;
  modal.classList.add('active');
  textarea.focus();
}

function closeProfileEditModal() {
  document.getElementById('editPostModal')?.classList.remove('active');
  _editingPostId = null;
  _editingPostEl = null;
}

async function submitProfileEdit() {
  const postId     = _editingPostId;
  const postEl     = _editingPostEl;
  const newContent = document.getElementById('editPostContent')?.value.trim();
  if (!postId || !newContent) return;

  const btn = document.getElementById('saveEditPostBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ content: newContent })
    });

if (res.ok) {
    const contentEl = postEl?.querySelector('.post-card-body');
    if (contentEl) contentEl.innerHTML = formatContent(newContent) + ' <span class="edited-tag">(edited)</span>';
    closeProfileEditModal();
    showToast('Post updated ✨', 'success');
}else {
      showToast('Failed to update', 'error');
    }
  } catch {
    showToast('Failed to update', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Save Changes'; }
  }
}

// ── Profile Delete Post Modal ─────────────────────────────
let _deletingPostId = null;
let _deletingPostEl = null;

function openProfileDeleteModal(postId, postEl) {
  _deletingPostId = postId;
  _deletingPostEl = postEl;
  document.getElementById('deletePostModal')?.classList.add('active');
}

function closeProfileDeleteModal() {
  document.getElementById('deletePostModal')?.classList.remove('active');
  _deletingPostId = null;
  _deletingPostEl = null;
}

async function submitProfileDelete() {
  const postId = _deletingPostId;
  const postEl = _deletingPostEl;
  if (!postId) return;

  const btn = document.getElementById('confirmDeletePostBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…'; }

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method:  'DELETE',
      headers: authHeaders()
    });

    if (res.ok) {
      closeProfileDeleteModal();
      postEl.style.transition = 'all 0.3s ease';
      postEl.style.opacity    = '0';
      postEl.style.transform  = 'translateY(-10px)';
      setTimeout(() => postEl.remove(), 300);
      showToast('Post deleted', 'success');
    } else {
      showToast('Failed to delete', 'error');
    }
  } catch {
    showToast('Failed to delete', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete'; }
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

  document.getElementById("editProfileBtn")?.addEventListener("click", openEditModal);
  document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
  document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);
  document.getElementById("saveProfileBtn")?.addEventListener("click", saveProfile);
  document.getElementById('closeCommentModal')?.addEventListener('click', closeCommentModal);
  document.getElementById('commentModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('commentModal')) closeCommentModal();
});
  document.getElementById('commentSubmitBtn')?.addEventListener('click', submitProfileComment);
  document.getElementById('commentInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitProfileComment();
  });

  document.getElementById("editModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });

  document.getElementById("editBioInput")?.addEventListener("input", updateBioCount);

  try {
    const user = await apiGetProfile();
    if (!user) return; 

    _currentUser = user;

    renderProfile(user);
    populateSidebar(user);
    renderAbout(user);

    try {
      const posts = await apiGetUserPosts(user._id);
      const totalLikes = posts.reduce((sum, p) => sum + (p.reactions?.length || p.likes_count || 0), 0);
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
  // Edit post modal
document.getElementById('closeEditPostModal')?.addEventListener('click', closeProfileEditModal);
document.getElementById('cancelEditPostModal')?.addEventListener('click', closeProfileEditModal);
document.getElementById('editPostModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('editPostModal')) closeProfileEditModal();
});
document.getElementById('saveEditPostBtn')?.addEventListener('click', submitProfileEdit);
document.getElementById('editPostContent')?.addEventListener('input', () => {
  const len = document.getElementById('editPostContent')?.value.length || 0;
  const counter = document.getElementById('editPostCharCount');
  if (counter) counter.textContent = len;
});

// Delete post modal
document.getElementById('closeDeletePostModal')?.addEventListener('click', closeProfileDeleteModal);
document.getElementById('cancelDeletePostModal')?.addEventListener('click', closeProfileDeleteModal);
document.getElementById('deletePostModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('deletePostModal')) closeProfileDeleteModal();
});
document.getElementById('confirmDeletePostBtn')?.addEventListener('click', submitProfileDelete);
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
      badge.style.display = "none";
    }
  } catch (err) {
    console.warn("Badge fetch failed:", err);
  }
}

// ── Comment Modal ─────────────────────────────────────────
let _activeCommentPostId = null;

function openCommentModal(postId) {
    _activeCommentPostId = postId;
    const modal    = document.getElementById('commentModal');
    const list     = document.getElementById('commentsList');
    const input    = document.getElementById('commentInput');
    const preview  = document.getElementById('commentModalPost');
    const inputAvatar = document.getElementById('commentInputAvatar');

    // Show current user avatar
    if (inputAvatar && _currentUser) {
        inputAvatar.innerHTML = _currentUser.avatar_url
            ? `<img src="${escapeHTML(_currentUser.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : getInitials(_currentUser.display_name || _currentUser.username);
    }

    // Fetch post data to show preview and comments
    fetch(`${API_BASE}/posts/${postId}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(post => {
          const isLiked = _currentUser && post.reactions?.some(r => 
              r?.toString() === _currentUser._id?.toString() || 
              r === _currentUser._id
          );
            // Post preview
            if (preview) {
                const user       = post.user_id;
                const authorName = user?.display_name || user?.username || 'Anonymous';
                const avatarHtml = user?.avatar_url
                    ? `<img src="${escapeHTML(user.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                    : authorName.charAt(0).toUpperCase();

                let postSpotify = '';
                if (post.spotify_track_url && !post.shared_from) {
                    const id = extractSpotifyId(post.spotify_track_url);
                    if (id) postSpotify = `
                        <div style="margin-top:10px;border-radius:12px;overflow:hidden;">
                            <iframe src="https://open.spotify.com/embed/track/${id}"
                                width="100%" height="80" frameborder="0"
                                allow="encrypted-media" loading="lazy"
                                style="border-radius:12px;display:block;"></iframe>
                        </div>`;
                }

                let sharedHtml = '';
                if (post.shared_from && post.shared_from._id) {
                    const orig     = post.shared_from;
                    const origUser = orig.user_id;
                    const origName = origUser?.display_name || origUser?.username || 'Someone';
                    const origAvatar = origUser?.avatar_url
                        ? `<img src="${escapeHTML(origUser.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                        : origName.charAt(0).toUpperCase();

                    let origSpotify = '';
                    if (orig.spotify_track_url) {
                        const id = extractSpotifyId(orig.spotify_track_url);
                        if (id) origSpotify = `
                            <div style="margin-top:10px;border-radius:12px;overflow:hidden;">
                                <iframe src="https://open.spotify.com/embed/track/${id}"
                                    width="100%" height="80" frameborder="0"
                                    allow="encrypted-media" loading="lazy"
                                    style="border-radius:12px;display:block;"></iframe>
                            </div>`;
                    }

                    sharedHtml = `
                        <div class="shared-post-card">
                            <div class="shared-post-header">
                                <div class="shared-post-avatar">${origAvatar}</div>
                                <div class="shared-post-meta">
                                    <div class="shared-post-author">${escapeHTML(origName)}</div>
                                </div>
                            </div>
                            ${orig.content ? `<div class="shared-post-content">${formatContent(orig.content)}</div>` : ''}
                            ${origSpotify}
                        </div>`;
                }

                preview.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#e06a72,#d65d64);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;overflow:hidden;flex-shrink:0;">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div style="font-size:14px;font-weight:600;color:#fff;">${escapeHTML(authorName)}</div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.5);">${timeAgo(post.createdAt)}</div>
                        </div>
                    </div>
                    ${post.content ? `<div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;margin-bottom:8px;">${formatContent(post.content)}</div>` : ''}
                    ${postSpotify}
                    ${sharedHtml}
                    <div class="cmp-stats">
                        <span class="post-action ${isLiked ? 'liked' : ''}" style="cursor:default">
                            <i class="${isLiked ? 'fas' : 'far'} fa-heart" style="${isLiked ? 'color:#e06a72' : ''}"></i>
                            ${post.reactions?.length || 0}
                        </span>
                        <span>
                            <i class="far fa-comment"></i>
                            ${post.comments?.length || 0} ${post.comments?.length === 1 ? 'comment' : 'comments'}
                        </span>
                        <span>
                            <i class="fas fa-share"></i>
                            ${post.shares_count || 0} ${post.shares_count === 1 ? 'share' : 'shares'}
                        </span>
                    </div>`;
            }

            // Render comments
            list.innerHTML = '';
            const comments = post.comments || [];
            if (comments.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);font-size:13px;padding:20px 0;">No comments yet. Be the first!</div>';
            } else {
                comments.forEach(c => {
                    const name   = c.user_id?.display_name || c.user_id?.username || 'User';
                    const avatar = c.user_id?.avatar_url
                        ? `<img src="${escapeHTML(c.user_id.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                        : name.charAt(0).toUpperCase();

                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex;align-items:flex-start;gap:8px;';
                    item.innerHTML = `
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#e06a72,#d65d64);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;flex-shrink:0;overflow:hidden;">
                            ${avatar}
                        </div>
                        <div style="background:#3a3b3c;border-radius:18px;padding:8px 14px;">
                            <div style="font-size:13px;font-weight:600;color:#fff;">${escapeHTML(name)}</div>
                            <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(c.text)}</div>
                        </div>`;
                    list.appendChild(item);
                });
            }
        })
        .catch(() => {
            list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:20px 0;">Could not load comments.</div>';
        });

        if (input) input.value = '';
        modal.style.display = 'flex';
        if (input) input.focus();

}

function closeCommentModal() {
    document.getElementById('commentModal').style.display = 'none';
    _activeCommentPostId = null;
}

async function submitProfileComment() {
    const input  = document.getElementById('commentInput');
    const text   = input?.value.trim();
    const postId = _activeCommentPostId;
    if (!text || !postId) return;

    const btn = document.getElementById('commentSubmitBtn');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ text })
        });

        if (!res.ok) throw new Error('Failed');
        const comments = await res.json();

        // Update count on post card
        const countEl = document.querySelector(`.post-card [data-post-id="${postId}"][data-action="comment"]`);
        if (countEl) countEl.innerHTML = `<i class="fas fa-comment"></i> ${comments.length}`;

        // Add to list
        const list  = document.getElementById('commentsList');
        const empty = list.querySelector('[style*="No comments"]');
        if (empty) empty.remove();

        const avatar = _currentUser?.avatar_url
            ? `<img src="${escapeHTML(_currentUser.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : getInitials(_currentUser?.display_name || _currentUser?.username || 'U');

        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:flex-start;gap:8px;';
        item.innerHTML = `
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#e06a72,#d65d64);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;flex-shrink:0;overflow:hidden;">
                ${avatar}
            </div>
            <div style="background:#3a3b3c;border-radius:18px;padding:8px 14px;">
                <div style="font-size:13px;font-weight:600;color:#fff;">${escapeHTML(_currentUser?.display_name || _currentUser?.username || 'You')}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(text)}</div>
            </div>`;
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;

        if (input) input.value = '';
        showToast('Comment posted! 💬', 'success');

    } catch {
        showToast('Could not post comment.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
  initNotificationBadge();
  setInterval(initNotificationBadge, 3000);
});