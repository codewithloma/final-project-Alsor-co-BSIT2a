// DearBUP Frontend - Main JavaScript
class DearBUP {
    constructor() {
        this.postsFeed = document.getElementById('postsFeed');
        this.createPostModal = document.getElementById('createPostModal');
        this.postForm = document.getElementById('postForm');
        this.postContent = document.getElementById('postContent');
        this.postSubmit = document.querySelector('.post-submit');
        this.charCount = document.getElementById('charCount');
        this.writePostBtn = document.getElementById('writePostBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.startWriting = document.getElementById('startWriting');
        this.navItems = document.querySelectorAll('.nav-item[data-page]');
        this.lettersSection = document.getElementById('lettersSection');
        this.lettersContainer = document.getElementById('lettersContainer');

        // Story state
        this.currentLetterIndex = 0;
        this.lettersData = [];
        this.selectedTrack = null;

        // Spotify (mock — swap CLIENT_ID + proxy for real OAuth)
        this.spotifyToken = null;
        this.spotifySearchTimer = null;

        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSamplePosts();
        this.initLetters();
        this.initAnimations();
    }

    // ─── Event Binding ─────────────────────────────────────────
    bindEvents() {
        this.writePostBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        this.startWriting.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.createPostModal.addEventListener('click', (e) => { if (e.target === this.createPostModal) this.closeModal(); });
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        this.postContent.addEventListener('input', () => this.updateCharCount());
        this.navItems.forEach(item => item.addEventListener('click', (e) => this.handleNavigation(e)));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.post').forEach(post => observer.observe(post));
    }

    // ─── Letters ───────────────────────────────────────────────
    initLetters() {
        this.loadLettersData();
        this.renderLetters();
        this.bindLettersEvents();
        this.initLetterCompose();
        this.initStoryOverlay();
    }

    loadLettersData() {
        this.lettersData = [
            {
                id: 1,
                authorName: 'Sarah M.',
                content: 'Today I realized how much Ive grown since freshman year. The late nights studying, the friendships that lasted, the moments I felt truly alive. Grateful for every step of this journey.',
                track:{
                    name: 'golden hour',
                    artist: 'JVKE',
                    art: 'https://i.scdn.co/image/ab67616d0000b273b0fe40f4dc89ae8be4e7f0d1',
                    url: 'https://open.spotify.com/track/5odlY52u43F5BjByhxg7wg'
                }
            },
            {
                id: 2,
                authorName: 'James R.',
                content: 'BUP has been more than a school — its been home. To everyone reading this: keep writing your story. Its yours alone.',
                track: null
            },
            {
                id: 3,
                authorName: 'Maria L.',
                content: 'Sometimes you need to write it out to let it go. This place taught me that. Thank you, BUP family. Every moment here shaped who I am.',
                track: {
                    name: 'Die For You',
                    artist: 'The Weeknd',
                    art: 'https://i.scdn.co/image/ab67616d0000b27396c6e28adc36fcf68c35dbde',
                    url: 'https://open.spotify.com/track/2LBqCSwhJGcFQeTHMVGwy3'
                }
            },
            {
                id: 4,
                authorName: 'Alex K.',
                content: 'Letter to my future self: You did it. You graduated. You made it through the tough days. Proud of you.',
                track: null
            }
        ];
    }

    renderLetters() {
        this.lettersContainer.innerHTML = '';

        // Add-Letter card first
        const addCard = document.createElement('div');
        addCard.className = 'letter-card-add';
        addCard.innerHTML = `
            <div class="letter-card-add-icon"><i class="fas fa-plus"></i></div>
            <div class="letter-card-add-label">Write a Letter</div>
        `;
        addCard.addEventListener('click', () => this.openLetterCompose());
        this.lettersContainer.appendChild(addCard);

        // Letter cards
        this.lettersData.forEach((letter, index) => {
            const card = this.createLetterCard(letter, index);
            this.lettersContainer.appendChild(card);
        });
    }

    createLetterCard(letter, index) {
        const card = document.createElement('div');
        card.className = 'letter-card';
        card.dataset.index = index;

        card.innerHTML = `
            ${letter.track ? '<div class="letter-music-badge"><i class="fab fa-spotify"></i></div>' : ''}
            <div class="letter-card-header">
                <div class="letter-avatar">${letter.authorName.charAt(0).toUpperCase()}</div>
                <div class="letter-author">${letter.authorName}</div>
            </div>
            <div class="letter-preview">${letter.content}</div>
        `;

        card.addEventListener('click', () => this.openStory(index));
        return card;
    }

    bindLettersEvents() {
        // Drag-scroll
        let isDown = false, startX, scrollLeft;
        this.lettersContainer.addEventListener('mousedown', (e) => {
            isDown = true; startX = e.pageX - this.lettersContainer.offsetLeft;
            scrollLeft = this.lettersContainer.scrollLeft;
        });
        this.lettersContainer.addEventListener('mouseleave', () => { isDown = false; });
        this.lettersContainer.addEventListener('mouseup', () => { isDown = false; });
        this.lettersContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return; e.preventDefault();
            const x = e.pageX - this.lettersContainer.offsetLeft;
            this.lettersContainer.scrollLeft = scrollLeft - (x - startX) * 2;
        });
    }

    // ─── Letter Compose ────────────────────────────────────────
    initLetterCompose() {
        const modal = document.getElementById('letterComposeModal');
        const closeBtn = document.getElementById('closeLetterModal');
        const submitBtn = document.getElementById('submitLetterBtn');
        const searchBtn = document.getElementById('spotifySearchBtn');
        const searchInput = document.getElementById('spotifySearchInput');
        const clearBtn = document.getElementById('clearTrackBtn');
        const letterContent = document.getElementById('letterContent');

        closeBtn.addEventListener('click', () => this.closeLetterCompose());
        modal.addEventListener('click', (e) => { if (e.target === modal) this.closeLetterCompose(); });

        // Char counter
        letterContent.addEventListener('input', () => {
            const len = letterContent.value.length;
            document.getElementById('letterCharCount').textContent = len;
        });

        // Spotify search
        searchBtn.addEventListener('click', () => this.spotifySearch());
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.spotifySearch(); });

        // Debounce search on type
        searchInput.addEventListener('input', () => {
            clearTimeout(this.spotifySearchTimer);
            if (searchInput.value.trim().length > 2) {
                this.spotifySearchTimer = setTimeout(() => this.spotifySearch(), 500);
            }
        });

        clearBtn.addEventListener('click', () => this.clearSelectedTrack());

        submitBtn.addEventListener('click', () => {
            const content = document.getElementById('letterContent').value.trim();
            if (!content) return;

            const newLetter = {
                id: Date.now(),
                authorName: 'You',
                content,
                track: this.selectedTrack || null
            };

            this.lettersData.unshift(newLetter);
            this.renderLetters();
            this.closeLetterCompose();
            this.showToast('Letter posted! ✉️');
        });
    }

    openLetterCompose() {
        const modal = document.getElementById('letterComposeModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('letterContent').focus();
    }

    closeLetterCompose() {
        const modal = document.getElementById('letterComposeModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('letterContent').value = '';
        document.getElementById('letterCharCount').textContent = '0';
        document.getElementById('spotifySearchInput').value = '';
        this.clearSelectedTrack();
        this.hideSpotifyResults();
    }

    // ─── Spotify Search ────────────────────────────────────────
    async spotifySearch() {
        const query = document.getElementById('spotifySearchInput').value.trim();
        if (!query) return;

        this.showSpotifyLoading();

        try {
            const token = await this.getSpotifyToken();
            const res = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await res.json();

            if (data.tracks && data.tracks.items.length > 0) {
                this.renderSpotifyResults(data.tracks.items);
            } else {
                this.renderSpotifyEmpty();
            }
        } catch (err) {
            console.error('Spotify search error:', err);
            // Fallback to mock results for demo
            this.renderSpotifyResults(this.getMockTracks(query));
        }
    }

    async getSpotifyToken() {
        if (this.spotifyToken && this.spotifyToken.expires > Date.now()) {
            return this.spotifyToken.value;
        }

        // ── Real implementation ──────────────────────────────
        // Replace with your Client Credentials flow via backend proxy:
        // const res = await fetch('/api/spotify/token');
        // const data = await res.json();
        // this.spotifyToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
        // return this.spotifyToken.value;

        // ── Demo fallback (returns null, triggers mock data) ──
        throw new Error('No Spotify token — using mock data');
    }

    getMockTracks(query) {
        const mocks = [
            { id: '1', name: 'golden hour', artists: [{ name: 'JVKE' }], duration_ms: 209000, album: { images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273b0fe40f4dc89ae8be4e7f0d1' }] }, external_urls: { spotify: 'https://open.spotify.com/track/5odlY52u43F5BjByhxg7wg' } },
            { id: '2', name: 'Die For You', artists: [{ name: 'The Weeknd' }], duration_ms: 260000, album: { images: [{ url: 'https://i.scdn.co/image/ab67616d0000b27396c6e28adc36fcf68c35dbde' }] }, external_urls: { spotify: 'https://open.spotify.com/track/2LBqCSwhJGcFQeTHMVGwy3' } },
            { id: '3', name: 'Lover', artists: [{ name: 'Taylor Swift' }], duration_ms: 221000, album: { images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647' }] }, external_urls: { spotify: 'https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI' } },
            { id: '4', name: 'good 4 u', artists: [{ name: 'Olivia Rodrigo' }], duration_ms: 178000, album: { images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2730b4621c94c07fc5c7f3ca975' }] }, external_urls: { spotify: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG' } },
        ];
        return mocks.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.artists[0].name.toLowerCase().includes(query.toLowerCase()))
            .concat(mocks).slice(0, 4);
    }

    showSpotifyLoading() {
        const resultsEl = document.getElementById('spotifyResults');
        const listEl = document.getElementById('spotifyResultsList');
        listEl.innerHTML = `
            <div class="spotify-loading">
                <div class="spotify-loading-dot"></div>
                <div class="spotify-loading-dot"></div>
                <div class="spotify-loading-dot"></div>
                <span>Searching Spotify…</span>
            </div>
        `;
        resultsEl.style.display = 'block';
        document.getElementById('spotifySelected').style.display = 'none';
    }

    renderSpotifyResults(tracks) {
        const listEl = document.getElementById('spotifyResultsList');
        listEl.innerHTML = '';
        document.getElementById('spotifyResults').style.display = 'block';

        tracks.forEach(track => {
            const art = track.album.images[0]?.url || '';
            const artist = track.artists.map(a => a.name).join(', ');
            const mins = Math.floor(track.duration_ms / 60000);
            const secs = String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0');

            const item = document.createElement('div');
            item.className = 'spotify-result-item';
            item.innerHTML = `
                <img class="spotify-result-img" src="${art}" alt="${track.name}" />
                <div class="spotify-result-info">
                    <div class="spotify-result-name">${track.name}</div>
                    <div class="spotify-result-artist">${artist}</div>
                </div>
                <div class="spotify-result-duration">${mins}:${secs}</div>
            `;

            item.addEventListener('click', () => {
                this.selectTrack({
                    name: track.name,
                    artist,
                    art,
                    url: track.external_urls.spotify
                });
            });

            listEl.appendChild(item);
        });
    }

    renderSpotifyEmpty() {
        const listEl = document.getElementById('spotifyResultsList');
        listEl.innerHTML = `<div class="spotify-loading"><span style="color:#aaa">No results found</span></div>`;
        document.getElementById('spotifyResults').style.display = 'block';
    }

    selectTrack(track) {
        this.selectedTrack = track;
        this.hideSpotifyResults();
        document.getElementById('spotifySearchInput').value = '';

        const selected = document.getElementById('spotifySelected');
        document.getElementById('selectedTrackArt').src = track.art;
        document.getElementById('selectedTrackName').textContent = track.name;
        document.getElementById('selectedTrackArtist').textContent = track.artist;
        document.getElementById('selectedTrackLink').href = track.url;
        selected.style.display = 'flex';
    }

    clearSelectedTrack() {
        this.selectedTrack = null;
        document.getElementById('spotifySelected').style.display = 'none';
    }

    hideSpotifyResults() {
        document.getElementById('spotifyResults').style.display = 'none';
    }

    // ─── Horizontal Story Overlay ──────────────────────────────
    initStoryOverlay() {
        const overlay = document.getElementById('letterStoryOverlay');
        document.getElementById('storyClose').addEventListener('click', () => this.closeStory());
        document.getElementById('storyPrev').addEventListener('click', () => this.prevLetter());
        document.getElementById('storyNext').addEventListener('click', () => this.nextLetter());

        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeStory(); });

        // Touch swipe
        let startX = 0;
        overlay.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        overlay.addEventListener('touchend', (e) => {
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
        const total = this.lettersData.length;

        // Text panel
        document.getElementById('storyAvatar').textContent = letter.authorName.charAt(0).toUpperCase();
        document.getElementById('storyAuthor').textContent = letter.authorName;
        document.getElementById('storyText').textContent = letter.content;

        // Progress bar
        document.getElementById('storyProgressFill').style.width =
            `${((this.currentLetterIndex + 1) / total) * 100}%`;

        // Dot indicators
        const dotsEl = document.getElementById('storyDots');
        dotsEl.innerHTML = '';
        this.lettersData.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'story-dot' + (i === this.currentLetterIndex ? ' active' : '');
            dotsEl.appendChild(dot);
        });

        // Nav button states
        document.getElementById('storyPrev').classList.toggle('disabled', this.currentLetterIndex === 0);
        document.getElementById('storyNext').classList.toggle('disabled', this.currentLetterIndex === total - 1);

        // Music panel
        const musicPanel = document.getElementById('storyMusicPanel');
        const noMusic = document.getElementById('storyNoMusic');

        if (letter.track) {
            document.getElementById('storyAlbumArt').src = letter.track.art;
            document.getElementById('storyTrackName').textContent = letter.track.name;
            document.getElementById('storyTrackArtist').textContent = letter.track.artist;
            document.getElementById('storySpotifyBtn').href = letter.track.url;
            musicPanel.style.display = 'flex';
            noMusic.style.display = 'none';
        } else {
            musicPanel.style.display = 'none';
            noMusic.style.display = 'flex';
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

    // ─── Post Modal ────────────────────────────────────────────
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
        this.postSubmit.disabled = length === 0;
        this.charCount.style.color = length > 240 ? '#e06a72' : length > 200 ? '#d65d64' : '#999';
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        const content = this.postContent.value.trim();
        if (!content) return;

        this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        this.postSubmit.disabled = true;

        try {
            const newPost = await this.createPost({
                content, author: '@yourusername',
                authorName: 'You', timestamp: new Date()
            });
            this.prependPost(newPost);
            this.postContent.value = '';
            this.updateCharCount();
            this.closeModal();
        } catch (err) {
            alert('Failed to post. Please try again.');
        } finally {
            this.postSubmit.innerHTML = 'Post';
            this.postSubmit.disabled = false;
        }
    }

    async createPost(postData) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ id: Date.now(), ...postData, likes: 0, reposts: 0, replies: 0, views: 1 }), 600);
        });
    }

    prependPost(postData) {
        const el = this.createPostElement(postData);
        this.postsFeed.insertBefore(el, this.postsFeed.firstChild);
        el.style.opacity = '0';
        el.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 50);
    }

    createPostElement(post) {
        const el = document.createElement('div');
        el.className = 'post';
        el.style.cssText = 'opacity:0;transform:translateY(20px);transition:all 0.4s cubic-bezier(0.4,0,0.2,1)';

        el.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${post.authorName.charAt(0)}</div>
                <div class="post-meta">
                    <div class="post-author">${post.authorName}</div>
                    <div class="post-handle">${post.author} · ${this.formatTime(post.timestamp)}</div>
                </div>
            </div>
            <div class="post-content">${this.formatContent(post.content)}</div>
            <div class="post-actions-bar">
                <div class="post-action-group">
                    <a class="post-action" data-action="reply" href="#">
                        <i class="fas fa-reply"></i><span>${post.replies}</span>
                    </a>
                    <a class="post-action" data-action="like" href="#">
                        <i class="far fa-heart"></i><span>${post.likes}</span>
                    </a>
                    <a class="post-action" data-action="share" href="#">
                        <i class="fas fa-share"></i><span>${post.views} views</span>
                    </a>
                </div>
            </div>
        `;

        el.querySelectorAll('.post-action').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); this.handlePostAction(e, post); });
        });

        return el;
    }

    loadSamplePosts() {
        const samplePosts = [
            { id: 1, content: "First day back at BUP Polangui! The campus is buzzing with energy. Can't wait to reconnect with everyone and dive into this semester! #BUP #PolanguiPride", author: '@jdoe', authorName: 'John Doe', timestamp: new Date(Date.now() - 1000 * 60 * 30), likes: 24, reposts: 3, replies: 5, views: 156 },
            { id: 2, content: "Shoutout to the CSS department for organizing that amazing welcome event! The food was 🔥 and the games were so much fun. BUP fam never disappoints! 🎉", author: '@janedoe', authorName: 'Jane Doe', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), likes: 42, reposts: 8, replies: 12, views: 289 },
            { id: 3, content: "Reminder: Library orientation tomorrow at 2PM! Perfect chance to get familiar with all the new resources. See you there! 📚 #BUPUpdates", author: '@bup_library', authorName: 'BUP Library', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), likes: 67, reposts: 15, replies: 3, views: 456 },
        ];

        samplePosts.forEach(post => {
            const el = this.createPostElement(post);
            this.postsFeed.appendChild(el);
            // Staggered entrance
            setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
        });
    }

    handlePostAction(e, post) {
        const action = e.currentTarget.dataset.action;
        const icon = e.currentTarget.querySelector('i');
        const countEl = e.currentTarget.querySelector('span');

        e.currentTarget.style.transform = 'scale(0.9)';
        setTimeout(() => { e.currentTarget.style.transform = ''; }, 150);

        if (action === 'like') {
            const isLiked = icon.classList.contains('fas');
            icon.className = isLiked ? 'far fa-heart' : 'fas fa-heart';
            if (!isLiked) icon.style.color = '#e06a72';
            else icon.style.color = '';
            countEl.textContent = parseInt(countEl.textContent) + (isLiked ? -1 : 1);
        } else {
            this.showToast(action.charAt(0).toUpperCase() + action.slice(1) + '!');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        document.querySelector('.nav-item.active')?.classList.remove('active');
        e.currentTarget.classList.add('active');
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.createPostModal.classList.contains('active')) this.closeModal();
            if (document.getElementById('letterComposeModal').classList.contains('active')) this.closeLetterCompose();
            if (document.getElementById('letterStoryOverlay').classList.contains('active')) this.closeStory();
        }
        if (document.getElementById('letterStoryOverlay').classList.contains('active')) {
            if (e.key === 'ArrowRight') this.nextLetter();
            if (e.key === 'ArrowLeft') this.prevLetter();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && this.postForm.contains(document.activeElement)) {
            this.postForm.dispatchEvent(new Event('submit'));
        }
    }

    formatTime(timestamp) {
        const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return `${Math.floor(diff / 1440)}d`;
    }

    formatContent(content) {
        return content
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position:fixed;top:20px;right:20px;
            background:linear-gradient(135deg,#e06a72,#d65d64);
            color:white;padding:12px 20px;border-radius:25px;
            font-weight:500;z-index:10000;
            transform:translateX(120%);transition:transform 0.3s ease;
            box-shadow:0 8px 25px rgba(214,93,100,0.4);font-size:14px;
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }
}

// ─── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.dearBUP = new DearBUP();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
});

window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    const feed = document.querySelector('.center-feed');
    let loading = false;
    feed.addEventListener('scroll', () => {
        if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 100 && !loading) {
            loading = true;
            setTimeout(() => { loading = false; }, 1000);
        }
    });
});
