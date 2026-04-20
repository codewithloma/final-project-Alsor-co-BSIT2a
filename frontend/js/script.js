// DearBUP - Main Script
// Wired to backend API

const API = 'http://localhost:5000/api';

// ─── Auth Helpers (mirrors register.js) ─────────────────────
function getToken() {
    return localStorage.getItem('dearbup_token');
}

function getUser() {
    const raw = localStorage.getItem('dearbup_user');
    return raw ? JSON.parse(raw) : null;
}

function logout() {
    localStorage.removeItem('dearbup_token');
    localStorage.removeItem('dearbup_user');
    window.location.href = '../../index.html';
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// ─── Guard: redirect if not logged in ───────────────────────
(function guardAuth() {
    if (!getToken() || !getUser()) {
        window.location.href = '../../index.html';
    }
})();

// ─── Boot sidebar user info ──────────────────────────────────
function bootSidebar() {
    const user = getUser();
    if (!user) return;
    const name = user.name || 'You';
    document.getElementById('sidebarName').textContent    = name;
    document.getElementById('sidebarCourse').textContent  = user.course || user.role || '';
    document.getElementById('sidebarAvatar').textContent  = name.charAt(0).toUpperCase();
}

// ─── Main App Class ──────────────────────────────────────────
class DearBUP {
    constructor() {
        this.postsFeed        = document.getElementById('postsFeed');
        this.createPostModal  = document.getElementById('createPostModal');
        this.postForm         = document.getElementById('postForm');
        this.postContent      = document.getElementById('postContent');
        this.postSubmit       = document.querySelector('.post-submit');
        this.charCount        = document.getElementById('charCount');
        this.writePostBtn     = document.getElementById('writePostBtn');
        this.closeModalBtn    = document.getElementById('closeModal');
        this.lettersContainer = document.getElementById('lettersContainer');

        this.currentLetterIndex = 0;
        this.lettersData        = [];
        this.selectedTrack      = null;
        this.spotifySearchTimer = null;

        this.init();
    }

    init() {
        bootSidebar();
        this.bindEvents();
        this.loadPosts();
        this.loadLetters();
    }

    // ─── Events ──────────────────────────────────────────────
    bindEvents() {
        this.writePostBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.createPostModal.addEventListener('click', (e) => { if (e.target === this.createPostModal) this.closeModal(); });
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        this.postContent.addEventListener('input', () => this.updateCharCount());

        document.getElementById('addLetterCard').addEventListener('click', () => this.openLetterCompose());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.createPostModal.classList.contains('active')) this.closeModal();
                if (document.getElementById('letterComposeModal').classList.contains('active')) this.closeLetterCompose();
                if (document.getElementById('letterStoryOverlay').classList.contains('active')) this.closeStory();
            }
            if (document.getElementById('letterStoryOverlay').classList.contains('active')) {
                if (e.key === 'ArrowRight') this.nextLetter();
                if (e.key === 'ArrowLeft')  this.prevLetter();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && this.postForm.contains(document.activeElement)) {
                this.postForm.dispatchEvent(new Event('submit'));
            }
        });

        this.initLetterCompose();
        this.initStoryOverlay();
        this.initLettersDragScroll();
    }

    // ─── Posts ───────────────────────────────────────────────
    async loadPosts() {
        try {
            const res = await fetch(`${API}/posts`);
            if (!res.ok) throw new Error('Failed to load posts');
            const posts = await res.json();

            const loadingEl = document.getElementById('feedLoading');
            if (loadingEl) loadingEl.remove();

            if (!posts.length) {
                this.postsFeed.innerHTML = `
                    <div style="text-align:center;padding:60px 20px;color:#aaa;">
                        <i class="fas fa-feather-alt" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.4;"></i>
                        <p style="font-size:14px;">No posts yet. Be the first to share your story!</p>
                    </div>`;
                return;
            }

            posts.forEach(post => {
                const el = this.createPostElement(post);
                this.postsFeed.appendChild(el);
                setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
            });

        } catch (err) {
            console.error('loadPosts error:', err);
            const loadingEl = document.getElementById('feedLoading');
            if (loadingEl) loadingEl.innerHTML =
                `<p style="color:#e06a72;font-size:14px;">Failed to load posts. Is the server running?</p>`;
        }
    }

    createPostElement(post) {
        const el = document.createElement('div');
        el.className = 'post';
        el.dataset.id = post._id;
        el.style.cssText = 'opacity:0;transform:translateY(20px);transition:all 0.4s cubic-bezier(0.4,0,0.2,1)';

        const user        = post.user_id;
        const authorName  = user?.display_name || user?.username || 'Anonymous';
        const authorHandle = user?.username ? `@${user.username}` : '';
        const avatarLetter = authorName.charAt(0).toUpperCase();
        const reactCount  = post.reactions?.length || 0;
        const commentCount = post.comments?.length || 0;
        const currentUser = getUser();
        const alreadyLiked = currentUser && post.reactions?.some(
            r => r === currentUser.id || r?._id === currentUser.id
        );

        el.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${avatarLetter}</div>
                <div class="post-meta">
                    <div class="post-author">${authorName}</div>
                    <div class="post-handle">${authorHandle} · ${this.formatTime(post.createdAt)}</div>
                </div>
            </div>
            <div class="post-content">${this.formatContent(post.content)}</div>
            <div class="post-actions-bar">
                <div class="post-action-group">
                    <a class="post-action ${alreadyLiked ? 'liked' : ''}" data-action="like" href="#">
                        <i class="${alreadyLiked ? 'fas' : 'far'} fa-heart"
                           style="${alreadyLiked ? 'color:#e06a72;' : ''}"></i>
                        <span>${reactCount}</span>
                    </a>
                    <a class="post-action" data-action="comment" href="#">
                        <i class="fas fa-comment"></i><span>${commentCount}</span>
                    </a>
                    <a class="post-action" data-action="share" href="#">
                        <i class="fas fa-share"></i>
                    </a>
                </div>
            </div>`;

        el.querySelectorAll('.post-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePostAction(e, post._id, el);
            });
        });

        return el;
    }

    async handlePostAction(e, postId, el) {
        const action = e.currentTarget.dataset.action;

        if (action === 'like') {
            if (!getToken()) { this.showToast('Login to react'); return; }
            try {
                const res = await fetch(`${API}/posts/${postId}/react`, {
                    method: 'POST',
                    headers: authHeaders()
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                const btn   = el.querySelector('[data-action="like"]');
                const icon  = btn.querySelector('i');
                const count = btn.querySelector('span');
                const isNowLiked = !btn.classList.contains('liked');

                btn.classList.toggle('liked', isNowLiked);
                icon.className  = isNowLiked ? 'fas fa-heart' : 'far fa-heart';
                icon.style.color = isNowLiked ? '#e06a72' : '';
                count.textContent = data.reactions;

            } catch (err) {
                this.showToast('Failed to react');
            }

        } else if (action === 'share') {
            if (!getToken()) { this.showToast('Login to share'); return; }
            try {
                const res = await fetch(`${API}/posts/${postId}/share`, {
                    method: 'POST',
                    headers: authHeaders()
                });
                if (!res.ok) throw new Error();
                this.showToast('Post shared! ✨');
            } catch {
                this.showToast('Failed to share');
            }

        } else if (action === 'comment') {
            this.showToast('Comments coming soon!');
        }
    }

    openModal() {
        this.createPostModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.postContent.focus();
    }

    closeModal() {
        this.createPostModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.postContent.value = '';
        this.updateCharCount();
        this.postSubmit.disabled = true;
    }

    updateCharCount() {
        const length = this.postContent.value.length;
        this.charCount.textContent = length;
        this.postSubmit.disabled   = length === 0;
        this.charCount.style.color = length > 240 ? '#e06a72' : length > 200 ? '#d65d64' : '#999';
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        if (!getToken()) { this.showToast('Please login first'); return; }

        const content = this.postContent.value.trim();
        if (!content) return;

        this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        this.postSubmit.disabled  = true;

        try {
            const res = await fetch(`${API}/posts`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ content })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to post');

            // Reload feed so the new post shows with populated user
            this.postsFeed.innerHTML = `
                <div id="feedLoading" style="text-align:center;padding:40px;color:#aaa;">
                    <i class="fas fa-spinner fa-spin" style="font-size:24px;"></i>
                </div>`;
            await this.loadPosts();
            this.closeModal();
            this.showToast('Story shared! ✨');

        } catch (err) {
            this.showToast(err.message || 'Failed to post. Try again.');
        } finally {
            this.postSubmit.innerHTML = 'Post';
            this.postSubmit.disabled  = false;
        }
    }

    // ─── Letters ─────────────────────────────────────────────
    async loadLetters() {
        try {
            const res = await fetch(`${API}/letters`);
            if (!res.ok) throw new Error();
            this.lettersData = await res.json();
            this.renderLetterCards();
        } catch (err) {
            console.error('loadLetters error:', err);
        }
    }

    renderLetterCards() {
        const existing = this.lettersContainer.querySelectorAll('.letter-card');
        existing.forEach(c => c.remove());

        if (!this.lettersData.length) return;

        this.lettersData.forEach((letter, index) => {
            const card = this.createLetterCard(letter, index);
            this.lettersContainer.appendChild(card);
        });
    }

    createLetterCard(letter, index) {
        const card = document.createElement('div');
        card.className   = 'letter-card';
        card.dataset.index = index;

        const authorName = letter.display_name || 'Anonymous';
        const hasTrack   = !!letter.spotifySongName;

        card.innerHTML = `
            ${hasTrack ? '<div class="letter-music-badge"><i class="fab fa-spotify"></i></div>' : ''}
            <div class="letter-card-header">
                <div class="letter-avatar">${authorName.charAt(0).toUpperCase()}</div>
                <div class="letter-author">${authorName}</div>
            </div>
            <div class="letter-preview">${letter.letter_content}</div>`;

        card.addEventListener('click', () => this.openStory(index));
        return card;
    }

    initLettersDragScroll() {
        let isDown = false, startX, scrollLeft;
        this.lettersContainer.addEventListener('mousedown', (e) => {
            isDown     = true;
            startX     = e.pageX - this.lettersContainer.offsetLeft;
            scrollLeft = this.lettersContainer.scrollLeft;
        });
        this.lettersContainer.addEventListener('mouseleave', () => { isDown = false; });
        this.lettersContainer.addEventListener('mouseup',    () => { isDown = false; });
        this.lettersContainer.addEventListener('mousemove',  (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - this.lettersContainer.offsetLeft;
            this.lettersContainer.scrollLeft = scrollLeft - (x - startX) * 2;
        });
    }

    // ─── Letter Compose ───────────────────────────────────────
    initLetterCompose() {
        const modal       = document.getElementById('letterComposeModal');
        const closeBtn    = document.getElementById('closeLetterModal');
        const submitBtn   = document.getElementById('submitLetterBtn');
        const searchBtn   = document.getElementById('spotifySearchBtn');
        const searchInput = document.getElementById('spotifySearchInput');
        const clearBtn    = document.getElementById('clearTrackBtn');
        const content     = document.getElementById('letterContent');

        closeBtn.addEventListener('click', () => this.closeLetterCompose());
        modal.addEventListener('click', (e) => { if (e.target === modal) this.closeLetterCompose(); });

        content.addEventListener('input', () => {
            document.getElementById('letterCharCount').textContent = content.value.length;
        });

        searchBtn.addEventListener('click', () => this.spotifySearch());
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.spotifySearch(); });
        searchInput.addEventListener('input', () => {
            clearTimeout(this.spotifySearchTimer);
            if (searchInput.value.trim().length > 2) {
                this.spotifySearchTimer = setTimeout(() => this.spotifySearch(), 500);
            }
        });

        clearBtn.addEventListener('click', () => this.clearSelectedTrack());
        submitBtn.addEventListener('click', () => this.handleLetterSubmit());
    }

    openLetterCompose() {
        if (!getToken()) {
            this.showToast('Please login to write a letter');
            return;
        }
        document.getElementById('letterComposeModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('letterContent').focus();
    }

    closeLetterCompose() {
        document.getElementById('letterComposeModal').classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('letterTitle').value       = '';
        document.getElementById('letterContent').value     = '';
        document.getElementById('letterCharCount').textContent = '0';
        document.getElementById('letterType').value        = 'general';
        document.getElementById('letterAnonymous').checked = false;
        document.getElementById('spotifySearchInput').value = '';
        this.clearSelectedTrack();
        this.hideSpotifyResults();
    }

    async handleLetterSubmit() {
        const title   = document.getElementById('letterTitle').value.trim();
        const content = document.getElementById('letterContent').value.trim();
        const type    = document.getElementById('letterType').value;
        const anon    = document.getElementById('letterAnonymous').checked;

        if (!title || !content) {
            this.showToast('Please fill in the title and content.');
            return;
        }

        const submitBtn = document.getElementById('submitLetterBtn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled  = true;

        const payload = {
            letter_title:   title,
            letter_content: content,
            letter_type:    type,
            is_anonymous:   anon,
            spotifySongName:  this.selectedTrack?.name   || null,
            spotifyArtist:    this.selectedTrack?.artist  || null,
            spotifyTrackUri:  this.selectedTrack?.uri     || null,
            spotifyImageUrl:  this.selectedTrack?.art     || null
        };

        try {
            const res = await fetch(`${API}/letters`, {
                method:  'POST',
                headers: authHeaders(),
                body:    JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to post letter');

            this.lettersData.unshift(data.letter);
            this.renderLetterCards();
            this.closeLetterCompose();
            this.showToast('Letter posted! ✉️');

        } catch (err) {
            this.showToast(err.message || 'Failed to post letter.');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Letter';
            submitBtn.disabled  = false;
        }
    }

    // ─── Spotify Search (backend proxy) ──────────────────────
    async spotifySearch() {
        const query = document.getElementById('spotifySearchInput').value.trim();
        if (!query) return;

        this.showSpotifyLoading();

        try {
            const res = await fetch(`${API}/posts/spotify/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error();
            const tracks = await res.json();
            tracks.length ? this.renderSpotifyResults(tracks) : this.renderSpotifyEmpty();
        } catch (err) {
            console.error('Spotify search error:', err);
            this.renderSpotifyEmpty();
        }
    }

    showSpotifyLoading() {
        document.getElementById('spotifyResultsList').innerHTML = `
            <div class="spotify-loading">
                <div class="spotify-loading-dot"></div>
                <div class="spotify-loading-dot"></div>
                <div class="spotify-loading-dot"></div>
                <span>Searching…</span>
            </div>`;
        document.getElementById('spotifyResults').style.display  = 'block';
        document.getElementById('spotifySelected').style.display = 'none';
    }

    renderSpotifyResults(tracks) {
        const listEl = document.getElementById('spotifyResultsList');
        listEl.innerHTML = '';
        document.getElementById('spotifyResults').style.display = 'block';

        tracks.forEach(track => {
            const art    = track.album?.images?.[0]?.url || '';
            const artist = track.artists?.map(a => a.name).join(', ') || '';
            const mins   = Math.floor((track.duration_ms || 0) / 60000);
            const secs   = String(Math.floor(((track.duration_ms || 0) % 60000) / 1000)).padStart(2, '0');

            const item = document.createElement('div');
            item.className = 'spotify-result-item';
            item.innerHTML = `
                <img class="spotify-result-img" src="${art}" alt="${track.name}" />
                <div class="spotify-result-info">
                    <div class="spotify-result-name">${track.name}</div>
                    <div class="spotify-result-artist">${artist}</div>
                </div>
                <div class="spotify-result-duration">${mins}:${secs}</div>`;

            item.addEventListener('click', () => {
                this.selectTrack({
                    name:   track.name,
                    artist: artist,
                    art:    art,
                    uri:    track.uri,
                    url:    track.external_urls?.spotify || ''
                });
            });

            listEl.appendChild(item);
        });
    }

    renderSpotifyEmpty() {
        document.getElementById('spotifyResultsList').innerHTML =
            `<div class="spotify-loading"><span style="color:#aaa">No results found</span></div>`;
        document.getElementById('spotifyResults').style.display = 'block';
    }

    selectTrack(track) {
        this.selectedTrack = track;
        this.hideSpotifyResults();
        document.getElementById('spotifySearchInput').value        = '';
        document.getElementById('selectedTrackArt').src            = track.art;
        document.getElementById('selectedTrackName').textContent   = track.name;
        document.getElementById('selectedTrackArtist').textContent = track.artist;
        document.getElementById('selectedTrackLink').href          = track.url;
        document.getElementById('spotifySelected').style.display   = 'flex';
    }

    clearSelectedTrack() {
        this.selectedTrack = null;
        document.getElementById('spotifySelected').style.display = 'none';
    }

    hideSpotifyResults() {
        document.getElementById('spotifyResults').style.display = 'none';
    }

    // ─── Story Overlay ────────────────────────────────────────
    initStoryOverlay() {
        const overlay = document.getElementById('letterStoryOverlay');
        document.getElementById('storyClose').addEventListener('click', () => this.closeStory());
        document.getElementById('storyPrev').addEventListener('click',  () => this.prevLetter());
        document.getElementById('storyNext').addEventListener('click',  () => this.nextLetter());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeStory(); });

        let startX = 0;
        overlay.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        overlay.addEventListener('touchend',   (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { diff > 0 ? this.nextLetter() : this.prevLetter(); }
        });
    }

    openStory(index) {
        this.currentLetterIndex = index;
        this.renderStory();
        document.body.style.overflow = 'hidden';
        document.getElementById('letterStoryOverlay').classList.add('active');
    }

    renderStory() {
        const letter = this.lettersData[this.currentLetterIndex];
        const total  = this.lettersData.length;

        document.getElementById('storyAvatar').textContent = (letter.display_name || 'A').charAt(0).toUpperCase();
        document.getElementById('storyAuthor').textContent = letter.display_name || 'Anonymous';
        document.getElementById('storyTitle').textContent  = letter.letter_title || '';
        document.getElementById('storyText').textContent   = letter.letter_content;

        document.getElementById('storyProgressFill').style.width =
            `${((this.currentLetterIndex + 1) / total) * 100}%`;

        const dotsEl = document.getElementById('storyDots');
        dotsEl.innerHTML = '';
        this.lettersData.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'story-dot' + (i === this.currentLetterIndex ? ' active' : '');
            dotsEl.appendChild(dot);
        });

        document.getElementById('storyPrev').classList.toggle('disabled', this.currentLetterIndex === 0);
        document.getElementById('storyNext').classList.toggle('disabled', this.currentLetterIndex === total - 1);

        const musicPanel = document.getElementById('storyMusicPanel');
        const noMusic    = document.getElementById('storyNoMusic');

        if (letter.spotifySongName) {
            document.getElementById('storyAlbumArt').src             = letter.spotifyImageUrl || '';
            document.getElementById('storyTrackName').textContent    = letter.spotifySongName;
            document.getElementById('storyTrackArtist').textContent  = letter.spotifyArtist || '';
            const trackId = (letter.spotifyTrackUri || '').split(':')[2] || '';
            document.getElementById('storySpotifyBtn').href =
                trackId ? `https://open.spotify.com/track/${trackId}` : '#';
            musicPanel.style.display = 'flex';
            noMusic.style.display    = 'none';
        } else {
            musicPanel.style.display = 'none';
            noMusic.style.display    = 'flex';
        }
    }

    closeStory() {
        document.getElementById('letterStoryOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    nextLetter() {
        if (this.currentLetterIndex < this.lettersData.length - 1) {
            this.currentLetterIndex++;
            this.renderStory();
        }
    }

    prevLetter() {
        if (this.currentLetterIndex > 0) {
            this.currentLetterIndex--;
            this.renderStory();
        }
    }

    // ─── Utilities ────────────────────────────────────────────
    formatTime(timestamp) {
        const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
        if (diff < 1)    return 'Just now';
        if (diff < 60)   return `${diff}m`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return `${Math.floor(diff / 1440)}d`;
    }

    formatContent(content) {
        return content
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    showToast(message) {
        const existing = document.getElementById('dearbup-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'dearbup-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position:fixed;bottom:24px;right:24px;
            background:linear-gradient(135deg,#e06a72,#d65d64);
            color:white;padding:12px 20px;border-radius:25px;
            font-weight:500;z-index:10000;
            transform:translateX(120%);transition:transform 0.3s ease;
            box-shadow:0 8px 25px rgba(214,93,100,0.4);font-size:14px;`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }
}

// ─── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.dearBUP = new DearBUP();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar    = document.querySelector('.sidebar');

    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
});