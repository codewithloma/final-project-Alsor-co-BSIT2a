import { guardAuth, bootSidebar } from './auth.js';
import { PostManager } from './posts.js';
import { LetterManager } from './letters.js';
import { API } from './config.js';

const API_BASE = API;
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

function injectDeleteButtons() {
  const commentList = document.getElementById('commentsList');
  if (!commentList) return;

  const observer = new MutationObserver(() => {
    // 1. Look for BOTH .comment-item and any div that looks like a comment
    const items = commentList.querySelectorAll('div:not([data-has-delete])');
    
    items.forEach(item => {
      // Only target actual comment containers (they usually have a specific style or child)
      if (item.children.length > 0 || item.innerText.length > 0) {
        item.setAttribute('data-has-delete', 'true');
        item.style.position = 'relative'; // Anchor for the button
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';

        const btn = document.createElement('button');
        btn.className = 'delete-comment-btn';
        btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        
        // Manual Styles to ensure it shows up
        btn.style.color = '#ffffff'; 
        btn.style.opacity = '0.6';
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.padding = '8px';
        btn.style.fontSize = '14px';

        const commentId = item.getAttribute('data-comment-id') || item.id;
        const postId = document.getElementById('commentModal')?.getAttribute('data-post-id');

        btn.onclick = (e) => {
          e.stopPropagation();
          if (window.deleteComment) window.deleteComment(postId, commentId);
        };

        item.appendChild(btn);
      }
    });
  });

  observer.observe(commentList, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', injectDeleteButtons);