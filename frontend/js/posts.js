import { API } from './config.js';
import { getToken, getUser, authHeaders, logout } from './auth.js'; // Added logout import
import { formatTime, formatContent, showToast } from './utils.js';

export class PostManager {
    constructor() {
        this.postsFeed       = document.getElementById('postsFeed');
        this.createPostModal = document.getElementById('createPostModal');
        this.postForm         = document.getElementById('postForm');
        this.postContent     = document.getElementById('postContent');
        this.postSubmit      = document.getElementById('postSubmitBtn');
        this.charCount       = document.getElementById('charCount');
        this.writePostBtn    = document.getElementById('writePostBtn');
        this.closeModalBtn   = document.getElementById('closeModal');
        this.logoutBtn       = document.getElementById('logoutBtn'); // Added selector

        this.selectedTrack      = null;
        this.spotifySearchTimer = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPosts();
        this.initSpotifySearch();
    }

    bindEvents() {
        this.writePostBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.createPostModal.addEventListener('click', (e) => { if (e.target === this.createPostModal) this.closeModal(); });
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        this.postContent.addEventListener('input', () => this.updateCharCount());

        // Added Logout Event Listener
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout(); 
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.createPostModal.classList.contains('active')) this.closeModal();
        });
    }

    // --- SPOTIFY SEARCH ---
    initSpotifySearch() {
        const searchInput = document.getElementById('postSpotifyInput');
        const searchBtn   = document.getElementById('postSpotifySearchBtn');
        const clearBtn    = document.getElementById('postClearTrackBtn');

        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            clearTimeout(this.spotifySearchTimer);
            const query = searchInput.value.trim();
            if (query.length > 2) {
                this.spotifySearchTimer = setTimeout(() => this.spotifySearch(query), 500);
            }
        });

        if (searchBtn) searchBtn.addEventListener('click', () => this.spotifySearch(searchInput.value.trim()));
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearSelectedTrack());
    }

    async spotifySearch(query) {
        if (!query) return;
        try {
            const res = await fetch(`${API}/posts/spotify/search?q=${encodeURIComponent(query)}`);
            const tracks = await res.json();
            this.renderSpotifyResults(tracks);
        } catch (err) { console.error('Spotify error:', err); }
    }

    renderSpotifyResults(tracks) {
        const listEl = document.getElementById('postSpotifyResultsList');
        const resultsContainer = document.getElementById('postSpotifyResults');
        listEl.innerHTML = '';
        if (!tracks || tracks.length === 0) return;
        resultsContainer.style.display = 'block';

        tracks.forEach(track => {
            const item = document.createElement('div');
            item.className = 'spotify-result-item';
            item.innerHTML = `<img src="${track.album?.images?.[0]?.url || ''}"><div class="info"><div class="name">${track.name}</div><div class="artist">${track.artists[0].name}</div></div>`;
            item.addEventListener('click', () => this.selectTrack(track));
            listEl.appendChild(item);
        });
    }

    selectTrack(track) {
        this.selectedTrack = { name: track.name, artist: track.artists[0].name, url: track.external_urls.spotify, image: track.album?.images?.[0]?.url };
        document.getElementById('postSpotifyResults').style.display = 'none';
        document.getElementById('postSpotifyInput').value = '';
        document.getElementById('postSpotifySelected').style.display = 'flex';
        document.getElementById('postSelectedTrackName').textContent = track.name;
        document.getElementById('postSelectedTrackArtist').textContent = track.artists[0].name;
        document.getElementById('postSelectedTrackArt').src = track.album?.images?.[0]?.url;
    }

    clearSelectedTrack() {
        this.selectedTrack = null;
        document.getElementById('postSpotifySelected').style.display = 'none';
    }

    // --- DISPLAY & REACTIONS ---
    async loadPosts() {
        try {
            const res = await fetch(`${API}/posts`);
            const posts = await res.json();
            const loadingEl = document.getElementById('feedLoading');
            if (loadingEl) loadingEl.remove();

            this.postsFeed.innerHTML = '';
            posts.forEach(post => {
                const el = this.createPostElement(post);
                this.postsFeed.appendChild(el);
                setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
            });
        } catch (err) { console.error('loadPosts error:', err); }
    }

    createPostElement(post) {
        const el = document.createElement('div');
        el.className = 'post';
        el.dataset.id = post._id;
        el.style.cssText = 'opacity:0;transform:translateY(20px);transition:all 0.4s ease';

        const user = post.user_id;
        const authorName = user?.display_name || user?.username || 'Anonymous';
        const authorHandle = user?.username ? `@${user.username}` : '';
        const currentUser = getUser();
        const alreadyLiked = currentUser && post.reactions?.some(r => r === currentUser.id || r?._id === currentUser.id);

        let spotifyEmbedHtml = '';
        if (post.spotify_track_url) {
            const embedUrl = post.spotify_track_url.replace('/track/', '/embed/track/');
            spotifyEmbedHtml = `<div class="post-spotify-player" style="margin: 12px 0; border-radius: 12px; overflow: hidden; background: #282828;">
                <iframe src="${embedUrl}" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media" loading="lazy"></iframe>
            </div>`;
        }

        el.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${authorName.charAt(0).toUpperCase()}</div>
                <div class="post-meta">
                    <div class="post-author">${authorName}</div>
                    <div class="post-handle">${authorHandle} · ${formatTime(post.createdAt)}</div>
                </div>
            </div>
            <div class="post-content">${formatContent(post.content)}</div>
            ${spotifyEmbedHtml}
            <div class="post-actions-bar">
                <div class="post-action-group">
                    <a class="post-action ${alreadyLiked ? 'liked' : ''}" data-action="like" href="#">
                        <i class="${alreadyLiked ? 'fas' : 'far'} fa-heart" style="${alreadyLiked ? 'color:#e06a72;' : ''}"></i>
                        <span>${post.reactions?.length || 0}</span>
                    </a>
                    <a class="post-action" data-action="comment" href="#">
                        <i class="far fa-comment"></i><span>${post.comments?.length || 0}</span>
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
        if (!getToken()) { showToast('Login required'); return; }

        if (action === 'like') {
            try {
                const res = await fetch(`${API}/posts/${postId}/react`, { method: 'POST', headers: authHeaders() });
                const data = await res.json();
                const btn = el.querySelector('[data-action="like"]');
                const icon = btn.querySelector('i');
                const count = btn.querySelector('span');
                const isNowLiked = !btn.classList.contains('liked');

                btn.classList.toggle('liked', isNowLiked);
                icon.className = isNowLiked ? 'fas fa-heart' : 'far fa-heart';
                icon.style.color = isNowLiked ? '#e06a72' : '';
                count.textContent = data.reactions;
            } catch (err) { showToast('Action failed'); }
        } else if (action === 'share') {
            try {
                const res = await fetch(`${API}/posts/${postId}/share`, { method: 'POST', headers: authHeaders() });
                if (res.ok) { showToast('Post shared! ✨'); this.loadPosts(); }
            } catch { showToast('Failed to share'); }
        }
    }

    // --- SUBMISSION ---
    async handlePostSubmit(e) {
        e.preventDefault();
        if (!getToken()) { showToast('Please login'); return; }
        const content = this.postContent.value.trim();
        if (!content) return;

        this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        this.postSubmit.disabled = true;

        try {
            const res = await fetch(`${API}/posts`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ content, spotify_track_url: this.selectedTrack?.url, is_anonymous: false })
            });
            if (res.ok) { await this.loadPosts(); this.closeModal(); showToast('Posted! ✨'); }
        } catch (err) { showToast('Error'); }
        finally { this.postSubmit.innerHTML = 'Post'; this.postSubmit.disabled = false; }
    }

    openModal() { this.createPostModal.classList.add('active'); this.postContent.focus(); }
    closeModal() { this.createPostModal.classList.remove('active'); this.postContent.value = ''; this.clearSelectedTrack(); this.updateCharCount(); }
    updateCharCount() { const len = this.postContent.value.length; this.charCount.textContent = len; this.postSubmit.disabled = len === 0; }
}