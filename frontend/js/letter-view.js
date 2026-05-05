"use strict";

const API_BASE = 'http://localhost:5000/api';

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

async function loadLetter() {
    const params   = new URLSearchParams(window.location.search);
    const letterId = params.get('id');
    const main     = document.getElementById('main');

    if (!letterId) {
        main.innerHTML = `
            <div class="state-msg">
                <i class="fas fa-envelope-open"></i>
                <h2>No letter found</h2>
                <p>The letter ID is missing from the URL.</p>
            </div>`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/letters/${letterId}`);

        if (res.status === 404) {
            main.innerHTML = `
                <div class="state-msg">
                    <i class="fas fa-trash-alt"></i>
                    <h2>Letter not found</h2>
                    <p>This letter may have been deleted or doesn't exist.</p>
                </div>`;
            return;
        }

        if (!res.ok) throw new Error();
        const letter = await res.json();

        // Update page title
        document.title = `${letter.letter_title || 'Letter'} – DearBUP`;

        const authorName = letter.display_name || 'Anonymous';
const avatarHtml = (!letter.is_anonymous && letter.user_id?.avatar_url)
    ? `<img src="${escapeHTML(letter.user_id.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : escapeHTML(authorName.charAt(0).toUpperCase());

        // Spotify section
        let spotifyHtml = '';
        if (letter.spotifySongName) {
            const trackId  = (letter.spotifyTrackUri || '').split(':')[2] || '';
            const trackUrl = trackId ? `https://open.spotify.com/track/${trackId}` : '#';
            const embedUrl = trackId ? `https://open.spotify.com/embed/track/${trackId}` : '';

            spotifyHtml = `
                <div class="letter-spotify">
                    ${embedUrl ? `
                    <div class="spotify-embed">
                        <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                            allowtransparency="true" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"></iframe>
                    </div>` : ''}
                </div>`;
        }

        const typeLabel = letter.letter_type
            ? letter.letter_type.charAt(0).toUpperCase() + letter.letter_type.slice(1)
            : 'General';

        main.innerHTML = `
            <div class="letter-card">
                <div class="letter-header">
                    <div class="letter-avatar">${avatarHtml}</div> 
                    <div class="letter-meta">
                        <div class="letter-author">${escapeHTML(authorName)}</div>
                        <div class="letter-date">${timeAgo(letter.createdAt)}</div>
                    </div>
                    <span class="letter-type-badge">${escapeHTML(typeLabel)}</span>
                </div>

                <div class="letter-body">
                    <div class="letter-title">${escapeHTML(letter.letter_title || '')}</div>
                    <div class="letter-divider"></div>
                    <div class="letter-content">${escapeHTML(letter.letter_content || '')}</div>
                </div>

                ${spotifyHtml}

                <div class="letter-footer">
                    <div class="letter-footer-left">
                        <i class="fas fa-feather-alt"></i>
                        Written on DearBUP
                    </div>
                    <button class="share-btn" onclick="copyLink()">
                        <i class="fas fa-link"></i> Copy link
                    </button>
                </div>
            </div>`;

    } catch (err) {
        main.innerHTML = `
            <div class="state-msg">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Something went wrong</h2>
                <p>Could not load this letter. Please try again.</p>
            </div>`;
    }
}

function copyLink() {
    navigator.clipboard?.writeText(window.location.href)
        .then(() => {
            const btn = document.querySelector('.share-btn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { btn.innerHTML = '<i class="fas fa-link"></i> Copy link'; }, 2000);
            }
        });
}

document.addEventListener('DOMContentLoaded', loadLetter);