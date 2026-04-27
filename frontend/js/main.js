import { guardAuth, bootSidebar } from './auth.js';
import { PostManager } from './posts.js';
import { LetterManager } from './letters.js';

// ── Config ────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("dearbup_token");

let _badgePollInterval = null;

// Run Auth Check
guardAuth();

// ── Notification Badge ────────────────────────────────────
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

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Sidebar
  bootSidebar();

  // Main modules
  window.postManager   = new PostManager();
  window.letterManager = new LetterManager();

  // Notification badge — direct fetch, no DearBUPBadge dependency
  initNotificationBadge();

  // Mobile sidebar toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar    = document.querySelector('.sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () =>
      sidebar.classList.toggle('active')
    );
    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        sidebar.classList.remove('active');
      }
    });
  }
});