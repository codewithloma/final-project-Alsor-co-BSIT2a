import { guardAuth, bootSidebar } from './auth.js';
import { PostManager } from './posts.js';
import { LetterManager } from './letters.js';

// ── Config ────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("dearbup_token");

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
      badge.style.display = "none";
    }
  } catch (err) {
    console.warn("Badge fetch failed:", err);
  }
}

// ── Scroll to post from notification redirect ─────────────
function handlePostRedirect() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');
  if (!postId) return;

    setTimeout(() => {
      const token = getToken();
      fetch(`${API_BASE}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : { comments: [] })
        .then(post => {
          if (window.postManager) {
            window.postManager.openCommentModal(postId, post);
          }
        })
        .catch(err => console.warn('Post redirect fetch failed:', err));
    }, 600);
    
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

  }


// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  bootSidebar();

  window.postManager   = new PostManager();
  window.letterManager = new LetterManager();

  initNotificationBadge();
  setInterval(initNotificationBadge, 3000);

  handlePostRedirect(); // ← reads ?post=<id> and scrolls to it

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