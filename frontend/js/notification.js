// ============================================================
//  DearBUP – notifications.js
//  IT 112 – 2A | AlSor Co | AY 2025-2026
//
//  Backend contract:
//    GET /api/notifications          → getNotifications  (authMiddleware)
//    PUT /api/notifications/:id/read → markAsRead        (authMiddleware)
//
//  Notification model fields:
//    _id, user_id, from_user { username, display_name },
//    type, message, related_id, is_read, createdAt
//
//  Behaviour:
//    • On page open  → fetch all, mark every unread as read,
//                      reset sidebar badge to 0
//    • Card click    → redirect to the related post/content
//                      (uses related_id)
// ============================================================

"use strict";

// ── Config ────────────────────────────────────────────────
const API_BASE   = "http://localhost:5000/api";
const INDEX_URL  = "../index.html";
const HOME_URL   = "../pages/home.html";

// Where post links land. Adjust if you have a dedicated post page.
// The related_id will be appended as ?post=<id> or #post-<id>
const POST_BASE  = `${HOME_URL}?post=`;

// ── Auth ──────────────────────────────────────────────────
const getToken = () => localStorage.getItem("dearbup_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function requireAuth() {
  if (!getToken()) window.location.href = INDEX_URL;
}

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = ["toast", "show", type].filter(Boolean).join(" ");
  setTimeout(() => (el.className = "toast"), 3000);
}

// ── Utilities ─────────────────────────────────────────────
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name[0] || "?").toUpperCase();
}

function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function dateGroup(isoString) {
  const d     = new Date(isoString);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest  = new Date(today); yest.setDate(today.getDate() - 1);
  const dDay  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDay.getTime() === today.getTime()) return "Today";
  if (dDay.getTime() === yest.getTime())  return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// ── Type maps (match model enum exactly) ──────────────────
const TYPE_ICON = {
  reaction:     "fas fa-heart",
  comment:      "fas fa-comment",
  share:        "fas fa-share",
  event:        "fas fa-calendar-alt",
  organization: "fas fa-users",
};

// Types that carry a related_id pointing to a post
const POST_TYPES = new Set(["reaction", "comment", "share"]);

// ── API ───────────────────────────────────────────────────

/** GET /api/notifications */
async function apiGetNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    localStorage.removeItem("dearbup_token");
    localStorage.removeItem("dearbup_user");
    window.location.href = INDEX_URL;
    return null;
  }
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return res.json();
}

/** PUT /api/notifications/:id/read */
async function apiMarkAsRead(id) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Mark read failed (${res.status})`);
  return res.json();
}

// ── Mark ALL unread silently on page open ─────────────────
async function markAllReadSilently(notifications) {
  const unread = notifications.filter((n) => !n.is_read);
  if (!unread.length) return;

  // Mark in state immediately
  unread.forEach((n) => (n.is_read = true));

  // Reset sidebar badge via shared module
  if (window.DearBUPBadge) window.DearBUPBadge.reset();

  // Fire all PATCH requests in parallel — errors are silent
  await Promise.allSettled(unread.map((n) => apiMarkAsRead(n._id)));
}

// ── Redirect logic ────────────────────────────────────────
/**
 * Determines where to navigate when a notification card is clicked.
 * - reaction / comment / share  → home feed anchored to the post
 * - event / organization        → no redirect (no related_id target yet)
 */
function resolveRedirectUrl(notif) {
  if (POST_TYPES.has(notif.type) && notif.related_id) {
    // Navigate to home feed and highlight the specific post.
    // home.js reads ?post=<id> and scrolls/highlights that card.
    return `${POST_BASE}${notif.related_id}`;
  }
  return null; // no redirect for event/org notifications
}

// ── Sidebar ───────────────────────────────────────────────
function populateSidebar(user) {
  const initials = getInitials(user.display_name || user.name || user.username || "?");
  const av = document.getElementById("sidebarAvatar");
  const nm = document.getElementById("sidebarName");
  const cr = document.getElementById("sidebarCourse");
  if (av) {
    if (user.avatar_url) {
      av.innerHTML = `<img src="${escapeHTML(user.avatar_url)}" alt="" />`;
    } else {
      av.textContent = initials;
    }
  }
  if (nm) nm.textContent = user.display_name || user.name || user.username || "User";
  if (cr) cr.textContent = user.course || "";
}

// ── Build a single card ───────────────────────────────────
function buildCard(notif) {
  const card = document.createElement("div");
  // All cards render as already-read (we marked them all on page open)
  card.className     = "notif-card";
  card.dataset.id    = notif._id;
  card.dataset.type  = notif.type;
  card.dataset.relId = notif.related_id || "";

  const type     = notif.type || "reaction";
  const fromUser = notif.from_user;

  const displayName = fromUser
    ? escapeHTML(fromUser.display_name || fromUser.username || "Someone")
    : "BUP System";

  // Avatar / icon
let avatarHTML;
if (fromUser) {
  const inits = getInitials(fromUser.display_name || fromUser.username || "?");
  avatarHTML = `
    <div class="notif-from-avatar">
      ${fromUser.avatar_url
          ? `<img src="${escapeHTML(fromUser.avatar_url)}" alt=""
              style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
          : inits}
      <span class="type-dot ${escapeHTML(type)}">
        <i class="${TYPE_ICON[type] || "fas fa-bell"}"></i>
      </span>
    </div>`;
} else {
  avatarHTML = `
    <div class="notif-icon ${escapeHTML(type)}">
      <i class="${TYPE_ICON[type] || "fas fa-bell"}"></i>
    </div>`;
}

  // Bold the sender's name in the message
  const rawMsg      = escapeHTML(notif.message || "");
  const senderRaw   = fromUser ? escapeHTML(fromUser.display_name || fromUser.username || "") : "";
  const formattedMsg = senderRaw
    ? rawMsg.replace(new RegExp(`^(${senderRaw})`, "i"), "<strong>$1</strong>")
    : rawMsg;

  // Clickable indicator for post-linked notifications
  const hasLink = POST_TYPES.has(type) && notif.related_id;
  const linkHint = hasLink
    ? `<span class="notif-link-hint"><i class="fas fa-arrow-right"></i></span>`
    : "";

  card.innerHTML = `
    ${avatarHTML}
    <div class="notif-body">
      <div class="notif-message">${formattedMsg}</div>
      <div class="notif-time">${timeAgo(notif.createdAt)}</div>
    </div>
    ${linkHint}
  `;

  // Cursor hint
  if (hasLink) card.style.cursor = "pointer";

  return card;
}

// ── Render list ───────────────────────────────────────────
function renderList(notifications, filterType = "all") {
  const container = document.getElementById("notifList");
  if (!container) return;

  const filtered = filterType === "all"
    ? notifications
    : notifications.filter((n) => n.type === filterType);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="notif-empty">
        <i class="fas fa-bell-slash"></i>
        <p>${filterType === "all" ? "You're all caught up!" : `No ${filterType} notifications yet.`}</p>
        <small>New activity will show here.</small>
      </div>`;
    return;
  }

  container.innerHTML = "";

  // Group by date
  const groups = new Map();
  for (const n of filtered) {
    const label = dateGroup(n.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(n);
  }

  let delay = 0;
  for (const [label, items] of groups) {
    const sep = document.createElement("div");
    sep.className   = "notif-date-group";
    sep.textContent = label;
    container.appendChild(sep);

    for (const notif of items) {
      const card = buildCard(notif);
      card.style.animationDelay = `${delay * 0.04}s`;

      // Click → redirect to post if applicable
      card.addEventListener("click", () => {
        const url = resolveRedirectUrl(notif);
        if (url) window.location.href = url;
      });

      container.appendChild(card);
      delay++;
    }
  }
}

// ── Header: unread badge + mark-all button ────────────────
// On this page we auto-mark everything as read on load,
// so both are hidden after the initial markAllReadSilently().
function updateHeader(notifications) {
  const unread  = notifications.filter((n) => !n.is_read).length;
  const badge   = document.getElementById("unreadBadge");
  const markBtn = document.getElementById("markAllBtn");

  if (badge) {
    if (unread > 0) {
      badge.textContent   = unread > 99 ? "99+" : unread;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
  if (markBtn) {
    markBtn.style.display = unread > 0 ? "flex" : "none";
  }
}

// ── Manual "Mark all as read" (edge case — still exposed) ─
async function handleMarkAll() {
  const unread = _allNotifications.filter((n) => !n.is_read);
  if (!unread.length) return;

  const btn = document.getElementById("markAllBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Marking…'; }

  unread.forEach((n) => (n.is_read = true));
  updateHeader(_allNotifications);
  renderList(_allNotifications, _activeFilter);

  if (window.DearBUPBadge) window.DearBUPBadge.reset();

  try {
    for (const n of unread) await apiMarkAsRead(n._id);
    showToast("All notifications marked as read ✓", "success");
  } catch {
    showToast("Some notifications could not be marked.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double"></i> Mark all as read'; }
  }
}

// ── State ─────────────────────────────────────────────────
let _allNotifications = [];
let _activeFilter     = "all";

// ── Filters ───────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll(".notif-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".notif-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      _activeFilter = btn.dataset.filter;
      renderList(_allNotifications, _activeFilter);
    });
  });
}

// ── Logout ────────────────────────────────────────────────
function initLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("dearbup_token");
    localStorage.removeItem("dearbup_user");
    window.location.href = INDEX_URL;
  });
}

// ── Mobile sidebar ────────────────────────────────────────
function initMobileNav() {
  document.getElementById("menuToggle")?.addEventListener("click", () =>
    document.getElementById("sidebar")?.classList.toggle("active")
  );
}

// ── Bootstrap ─────────────────────────────────────────────
async function init() {
  requireAuth();
  initFilters();
  initLogout();
  initMobileNav();
  document.getElementById("markAllBtn")?.addEventListener("click", handleMarkAll);

  // Sidebar from cache
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem("dearbup_user") || "null"); }
    catch { return null; }
  })();
  if (cached) populateSidebar(cached);

  // ── Fetch ───────────────────────────────────────────────
  try {
    const data = await apiGetNotifications();
    if (!data) return; // redirected to login

    _allNotifications = data;

    // Show unread count briefly in header, then mark all read
    updateHeader(_allNotifications);
    renderList(_allNotifications, _activeFilter);

    // Mark all unread as read silently + reset sidebar badge
    await markAllReadSilently(_allNotifications);

    // Re-render header counts (should now be 0)
    updateHeader(_allNotifications);

  } catch (err) {
    console.error("[DearBUP notifications]", err);
    const container = document.getElementById("notifList");
    if (container) {
      container.innerHTML = `
        <div class="notif-empty">
          <i class="fas fa-exclamation-circle"></i>
          <p>Could not load notifications.</p>
          <small>Check your connection and try again.</small>
        </div>`;
    }
    showToast("Could not load notifications.", "error");
  }
}

document.addEventListener("DOMContentLoaded", init);

// ── GLOBAL BADGE API (Add this after init() function) ───────
window.DearBUPBadge = {
  /**
   * Reset sidebar badge to 0 (called after marking read)
   */
  reset() {
    const badgeEls = document.querySelectorAll('.notification-badge, #notificationBadge');
    badgeEls.forEach(el => {
      el.style.display = 'none';
      el.textContent = '0';
    });
  },

  /**
   * Update badge with unread count (called from other pages)
   */
  update(count) {
    const badgeEls = document.querySelectorAll('.notification-badge, #notificationBadge');
    badgeEls.forEach(el => {
      if (count > 0) {
        el.textContent = count > 99 ? '99+' : count;
        el.style.display = 'inline-flex';
      } else {
        el.style.display = 'none';
      }
    });
  },

  /**
   * Fetch fresh unread count from API
   */
  async refresh() {
    try {
      const res = await fetch(`${API_BASE}/notifications/count`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const { unreadCount } = await res.json();
        this.update(unreadCount);
        return unreadCount;
      }
    } catch (err) {
      console.warn('Badge refresh failed:', err);
    }
    return 0;
  }
};