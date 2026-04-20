import { API } from './config.js';
import { getToken, getUser, authHeaders } from './auth.js';
import { formatTime, formatContent, showToast } from './utils.js';

export class PostManager {
    constructor() {
        // DOM Elements
        this.postsFeed       = document.getElementById('postsFeed');
        this.createPostModal = document.getElementById('createPostModal');
        this.postForm        = document.getElementById('postForm');
        this.postContent     = document.getElementById('postContent');
        this.postSubmit      = document.getElementById('postSubmitBtn');
        this.charCount       = document.getElementById('charCount');
        this.writePostBtn    = document.getElementById('writePostBtn');
        this.closeModalBtn   = document.getElementById('closeModal');

        // Spotify Selection State
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.createPostModal.classList.contains('active')) this.closeModal();
        });
    }

    // --- SPOTIFY SEARCH LOGIC ---
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

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.spotifySearch(searchInput.value.trim()));
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSelectedTrack());
        }
    }

    async spotifySearch(query) {
        if (!query) return;
        try {
            const res = await fetch(`${API}/posts/spotify/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search failed');
            const tracks = await res.json();
            this.renderSpotifyResults(tracks);
        } catch (err) {
            console.error('Spotify search error:', err);
        }
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
            const imgUrl = track.album?.images?.[0]?.url || '';
            
            item.innerHTML = `
                <img src="${imgUrl}" alt="art">
                <div class="info">
                    <div class="name">${track.name}</div>
                    <div class="artist">${track.artists[0].name}</div>
                </div>`;
            
            item.addEventListener('click', () => this.selectTrack(track));
            listEl.appendChild(item);
        });
    }

    selectTrack(track) {
        this.selectedTrack = {
            name: track.name,
            artist: track.artists[0].name,
            url: track.external_urls.spotify,
            image: track.album?.images?.[0]?.url
        };

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

    // --- GET DATA & DISPLAY LOGIC ---
    async loadPosts() {
        try {
            const res = await fetch(`${API}/posts`);
            if (!res.ok) throw new Error('Failed to load posts');
            const posts = await res.json();

            const loadingEl = document.getElementById('feedLoading');
            if (loadingEl) loadingEl.remove();

            this.postsFeed.innerHTML = '';
            posts.forEach(post => {
                const el = this.createPostElement(post);
                this.postsFeed.appendChild(el);
                setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
            });
        } catch (err) {
            console.error('loadPosts error:', err);
        }
    }

    createPostElement(post) {
        const el = document.createElement('div');
        el.className = 'post';
        el.dataset.id = post._id;
        el.style.cssText = 'opacity:0;transform:translateY(20px);transition:all 0.4s cubic-bezier(0.4,0,0.2,1)';

        const user = post.user_id;
        const authorName = user?.display_name || user?.username || 'Anonymous';
        const avatarLetter = authorName.charAt(0).toUpperCase();
        
        // Transform the stored URL into a Playable Embed
        let spotifyEmbedHtml = '';
        if (post.spotify_track_url) {
            const embedUrl = post.spotify_track_url.replace('/track/', '/embed/track/');
            spotifyEmbedHtml = `
                <div class="post-spotify-player" style="margin: 12px 0; border-radius: 12px; overflow: hidden; background: #282828;">
                    <iframe 
                        src="${embedUrl}" 
                        width="100%" 
                        height="80" 
                        frameborder="0" 
                        allowtransparency="true" 
                        allow="encrypted-media; clipboard-write; picture-in-picture" 
                        loading="lazy">
                    </iframe>
                </div>`;
        }

        el.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${avatarLetter}</div>
                <div class="post-meta">
                    <div class="post-author">${authorName}</div>
                    <div class="post-handle">· ${formatTime(post.createdAt)}</div>
                </div>
            </div>
            <div class="post-content">${formatContent(post.content)}</div>
            
            ${spotifyEmbedHtml}

            <div class="post-actions-bar" style="margin-top:12px; display: flex; gap: 16px; color: #888; font-size: 14px;">
                <div class="post-action">
                    <i class="far fa-heart"></i> <span>${post.reactions?.length || 0}</span>
                </div>
                <div class="post-action">
                    <i class="far fa-comment"></i> <span>${post.comments?.length || 0}</span>
                </div>
            </div>`;

        return el;
    }

    // --- POST DATA LOGIC ---
    async handlePostSubmit(e) {
        e.preventDefault();
        if (!getToken()) { showToast('Please login first'); return; }

        const content = this.postContent.value.trim();
        if (!content) return;

        this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        this.postSubmit.disabled  = true;

        const payload = { 
            content: content,
            spotify_track_url: this.selectedTrack ? this.selectedTrack.url : null,
            is_anonymous: false 
        };

        try {
            const res = await fetch(`${API}/posts`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to post');

            this.postsFeed.innerHTML = '<div id="feedLoading"><i class="fas fa-spinner fa-spin"></i></div>';
            await this.loadPosts();
            this.closeModal();
            showToast('Story shared! ✨');

        } catch (err) {
            showToast(err.message);
        } finally {
            this.postSubmit.innerHTML = 'Post';
            this.postSubmit.disabled  = false;
        }
    }

    openModal() {
        this.createPostModal.classList.add('active');
        this.postContent.focus();
    }

    closeModal() {
        this.createPostModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.postContent.value = '';
        this.clearSelectedTrack();
        this.updateCharCount();
        this.postSubmit.disabled = true;
    }

    updateCharCount() {
        const length = this.postContent.value.length;
        this.charCount.textContent = length;
        this.postSubmit.disabled = length === 0;
    }
}