"use strict";
const API_BASE = 'http://localhost:5000/api';
let allLetters = [];
let activeFilter = 'all';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function renderLetters(letters) {
  const grid = document.getElementById('lettersGrid');

  if (!letters.length) {
    grid.innerHTML = `
      <div class="state-msg">
        <i class="fas fa-envelope-open"></i>
        <p>No letters found in this category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = letters.map((l, i) => {
    const authorName = l.is_anonymous ? 'Anonymous' : (l.display_name || l.user_id?.display_name || l.user_id?.username || 'Anonymous');
    const avatarHtml = (!l.is_anonymous && l.user_id?.avatar_url)
      ? `<img src="${escapeHTML(l.user_id.avatar_url)}" alt="" />`
      : escapeHTML(authorName.charAt(0).toUpperCase());

    const type = l.letter_type || 'general';
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const hasMusic = !!(l.spotifySongName || l.spotifyTrackUri);

    return `
      <a class="letter-card" href="letter-view.html?id=${l._id}" target="_blank"
         style="animation-delay:${i * 0.04}s">
        <div class="letter-card-header">
          <div class="lc-avatar">${avatarHtml}</div>
          <div class="lc-meta">
            <div class="lc-author">${escapeHTML(authorName)}</div>
            <div class="lc-date">${timeAgo(l.createdAt)}</div>
          </div>
          <span class="lc-badge ${type}">${escapeHTML(typeLabel)}</span>
        </div>
        <div class="lc-title">${escapeHTML(l.letter_title || 'Untitled')}</div>
        <div class="lc-preview">${escapeHTML(l.letter_content || '')}</div>
      ${hasMusic ? `
        <div class="lc-music">
            ${l.spotifyImageUrl
                ? `<img src="${escapeHTML(l.spotifyImageUrl)}" alt=""
                    style="width:42px;height:42px;border-radius:6px;object-fit:cover;flex-shrink:0;"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                <div style="display:none;width:42px;height:42px;border-radius:6px;background:rgba(29,185,84,0.15);align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fab fa-spotify" style="color:#1DB954;font-size:18px;"></i>
                </div>`
                : `<div style="width:42px;height:42px;border-radius:6px;background:rgba(29,185,84,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fab fa-spotify" style="color:#1DB954;font-size:18px;"></i>
                </div>`
            }
            <div class="lc-music-info">
                <div class="lc-music-title">${escapeHTML(l.spotifySongName || 'Unknown Track')}</div>
                <div class="lc-music-artist">${escapeHTML(l.spotifyArtist || 'Unknown Artist')}</div>
            </div>
            <i class="fab fa-spotify lc-music-icon"></i>
        </div>` : ''}
      </a>`;
  }).join('');
}

function applyFilter(filter) {
  activeFilter = filter;
  const filtered = filter === 'all'
    ? allLetters
    : allLetters.filter(l => (l.letter_type || 'general') === filter);
  renderLetters(filtered);
}

async function loadLetters() {
  try {
    const res = await fetch(`${API_BASE}/letters`);
    if (!res.ok) throw new Error();
    allLetters = await res.json();
    applyFilter(activeFilter);
  } catch {
    document.getElementById('lettersGrid').innerHTML = `
      <div class="state-msg">
        <i class="fas fa-exclamation-circle"></i>
        <p>Could not load letters. Please try again.</p>
      </div>`;
  }
}

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

loadLetters();