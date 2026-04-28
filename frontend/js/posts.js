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
        this._activePostId = null;
        this._sharePostId   = null;
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
        document.getElementById('closeCommentModal')?.addEventListener('click', () => this.closeCommentModal());
        document.getElementById('commentModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('commentModal')) this.closeCommentModal();
        });
        document.getElementById('commentSubmitBtn')?.addEventListener('click', () => this.submitComment());
        document.getElementById('commentInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitComment();
        });
        document.getElementById('closeShareModal')?.addEventListener('click', () => this.closeShareModal());
        document.getElementById('shareModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('shareModal')) this.closeShareModal();
        });
        document.getElementById('shareNowBtn')?.addEventListener('click', () => this.submitShare());
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
    const authorName   = user?.display_name || user?.username || 'Anonymous';
    const authorHandle = user?.username ? `@${user.username}` : '';
    const avatarHtml   = user?.avatar_url
        ? `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : authorName.charAt(0).toUpperCase();

    const currentUser  = getUser();
    const alreadyLiked = currentUser && post.reactions?.some(r => r === currentUser.id || r?._id === currentUser.id);

    // Spotify embed
    let spotifyEmbedHtml = '';
    if (post.spotify_track_url && !post.shared_from) {
        const embedUrl = post.spotify_track_url.replace('/track/', '/embed/track/');
        spotifyEmbedHtml = `
            <div class="post-spotify-player">
                <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                    allowtransparency="true" allow="encrypted-media" loading="lazy"></iframe>
            </div>`;
    }

    // Shared post card
    let sharedHtml = '';
    if (post.shared_from && typeof post.shared_from === 'object') {
        const orig       = post.shared_from;
        const origUser   = orig.user_id;
        const origName   = origUser?.display_name || origUser?.username || 'Someone';
        const origAvatar = origUser?.avatar_url
            ? `<img src="${origUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : origName.charAt(0).toUpperCase();

        let origSpotify = '';
        if (orig.spotify_track_url) {
            const embedUrl = orig.spotify_track_url.replace('/track/', '/embed/track/');
            origSpotify = `
                <div class="post-spotify-player" style="margin-top:10px;">
                    <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                        allowtransparency="true" allow="encrypted-media" loading="lazy"></iframe>
                </div>`;
        }

        sharedHtml = `
            <div class="shared-post-card">
                <div class="shared-post-header">
                    <div class="shared-post-avatar">${origAvatar}</div>
                    <div class="shared-post-meta">
                        <div class="shared-post-author">${origName}</div>
                        <div class="shared-post-time">${formatTime(orig.createdAt)}</div>
                    </div>
                </div>
                <div class="shared-post-content">${formatContent(orig.content || '')}</div>
                ${origSpotify}
            </div>`;
    }

    el.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${avatarHtml}</div>
            <div class="post-meta">
                <div class="post-author">${authorName}</div>
                <div class="post-handle">${authorHandle} · ${formatTime(post.createdAt)}</div>
            </div>
        </div>
        ${post.content ? `<div class="post-content">${formatContent(post.content)}</div>` : ''}
        ${spotifyEmbedHtml}
        ${sharedHtml}
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
                } else if (action === 'comment') {
            const res = await fetch(`${API}/posts/${postId}`, {
                headers: authHeaders()
            });
            const post = res.ok ? await res.json() : { comments: [] };
            this.openCommentModal(postId, post);
        } else if (action === 'share') {
            const res = await fetch(`${API}/posts/${postId}`, {
                headers: authHeaders()
            });
            const post = res.ok ? await res.json() : {};
            this.openShareModal(postId, post);
        }
    }
// --- MEDIA UPLOAD ---
   async uploadPostMedia(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            try {
                const mediaType = file.type.startsWith("video/")
                    ? "video"
                    : "image";

                const res = await fetch(`${API}/upload/post-media`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        file: reader.result,
                        mediaType
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Media upload failed");
                }

                resolve({
                    url: data.mediaUrl,
                    type: data.mediaType
                });

            } catch (error) {
                reject(error);
            }
        };

        reader.readAsDataURL(file);
    });
}
    // --- SUBMISSION ---
   async handlePostSubmit(e) {
        e.preventDefault();
        if (!getToken()) { showToast('Please login'); return; }

        const content = this.postContent.value.trim();
        
        const fileInput = document.getElementById('postFileInput'); 
        const selectedFile = fileInput?.files[0];

       
        if (!content && !selectedFile && !this.selectedTrack) return;

       
        this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        this.postSubmit.disabled = true;

        try {
            let uploadedMedia = null;

            // --- STEP 6 LOGIC START ---
            if (selectedFile) {
            
                uploadedMedia = await this.uploadPostMedia(selectedFile);
            }

            const res = await fetch(`${API}/posts`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    content,
                    spotify_track_url: this.selectedTrack?.url,
                    media: uploadedMedia, // This contains { url, type } from Cloudinary
                    is_anonymous: false
                }),
            });
            // --- STEP 6 LOGIC END ---

            if (res.ok) { 
                await this.loadPosts(); 
                this.closeModal(); 
                if (fileInput) fileInput.value = ''; // Reset file input
                showToast('Posted! ✨'); 
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create post");
            }

        } catch (err) { 
            console.error("Submission error:", err);
            showToast(err.message || 'Error'); 
        } finally { 
            this.postSubmit.innerHTML = 'Post'; 
            this.postSubmit.disabled = false; 
        }
    }

// --- COMMENTS ---
openCommentModal(postId, post) {
    this._activePostId = postId;
    const modal    = document.getElementById('commentModal');
    const list     = document.getElementById('commentsList');
    const input    = document.getElementById('commentInput');
    const postPreview = document.getElementById('commentModalPost');

    // Show post preview at top
    if (postPreview) {
        const user       = post.user_id;
        const authorName = user?.display_name || user?.username || 'Anonymous';
        const avatarHtml = user?.avatar_url
            ? `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : authorName.charAt(0).toUpperCase();

let sharedHtml = '';
if (post.shared_from && typeof post.shared_from === 'object') {
    const orig       = post.shared_from;
    const origUser   = orig.user_id;
    const origName   = origUser?.display_name || origUser?.username || 'Someone';
    const origAvatar = origUser?.avatar_url
        ? `<img src="${origUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : origName.charAt(0).toUpperCase();

    // ← ADD Spotify embed for shared post
    let origSpotify = '';
    if (orig.spotify_track_url) {
        const embedUrl = orig.spotify_track_url.replace('/track/', '/embed/track/');
        origSpotify = `
            <div style="margin-top:10px; border-radius:12px; overflow:hidden;">
                <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                    allowtransparency="true" allow="encrypted-media" loading="lazy"
                    style="border-radius:12px; display:block;"></iframe>
            </div>`;
    }

    sharedHtml = `
        <div class="shared-post-card">
            <div class="shared-post-header">
                <div class="shared-post-avatar">${origAvatar}</div>
                <div class="shared-post-meta">
                    <div class="shared-post-author">${origName}</div>
                    <div class="shared-post-time">${formatTime(orig.createdAt)}</div>
                </div>
            </div>
            <div class="shared-post-content">${formatContent(orig.content || '')}</div>
            ${origSpotify}
        </div>`;       
}

postPreview.innerHTML = `
    <div class="cmp-header">
        <div class="cmp-avatar">${avatarHtml}</div>
        <div class="cmp-meta">
            <div class="cmp-author">${authorName}</div>
            <div class="cmp-time">${formatTime(post.createdAt)}</div>
        </div>
    </div>
    <div class="cmp-content">${formatContent(post.content || '')}</div>
    ${sharedHtml}
    <div class="cmp-stats">
        <span><i class="fas fa-heart" style="color:#e06a72"></i> ${post.reactions?.length || 0}</span>
        <span><i class="far fa-comment"></i> ${post.comments?.length || 0} comments</span>
    </div>`;
    }

    // Show current user avatar in input area
    const inputAvatar = document.getElementById('commentInputAvatar');
    if (inputAvatar) {
        const currentUser = getUser();
        inputAvatar.innerHTML = currentUser?.avatar_url
            ? `<img src="${currentUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : (currentUser?.display_name || currentUser?.name || 'U').charAt(0).toUpperCase();
    }

    // Render comments
    list.innerHTML = '';
    const comments = post.comments || [];
    if (comments.length === 0) {
        list.innerHTML = '<div class="comment-empty">No comments yet. Be the first!</div>';
    } else {
        comments.forEach(c => {
            const name   = c.user_id?.display_name || c.user_id?.username || 'User';
            const avatar = c.user_id?.avatar_url
                ? `<img src="${c.user_id.avatar_url}" alt="" />`
                : name.charAt(0).toUpperCase();

            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `
                <div class="comment-avatar">${avatar}</div>
                <div class="comment-body">
                    <div class="comment-bubble">
                        <div class="comment-author">${name}</div>
                        <div class="comment-text">${c.text}</div>
                    </div>
                </div>`;
            list.appendChild(item);
        });
    }

    if (input) input.value = '';
    modal.classList.add('active');
    if (input) input.focus();
}

closeCommentModal() {
    document.getElementById('commentModal')?.classList.remove('active');
    this._activePostId = null;
}

async submitComment() {
    const input   = document.getElementById('commentInput');
    const text    = input?.value.trim();
    const postId  = this._activePostId;
    if (!text || !postId) return;

    const submitBtn = document.getElementById('commentSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; }

    try {
        const res = await fetch(`${API}/posts/${postId}/comment`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify({ text })
        });

        if (!res.ok) throw new Error('Comment failed');

        const comments = await res.json();

        // Update comment count on the post card
        const postEl    = document.querySelector(`.post[data-id="${postId}"]`);
        const countEl   = postEl?.querySelector('[data-action="comment"] span');
        if (countEl) countEl.textContent = comments.length;

        // Add new comment to list
        const list = document.getElementById('commentsList');
        const empty = list.querySelector('.comment-empty');
        if (empty) empty.remove();

        const currentUser = getUser();
        const avatar = currentUser?.avatar_url
            ? `<img src="${currentUser.avatar_url}" alt="" />`
            : (currentUser?.display_name || currentUser?.name || 'U').charAt(0).toUpperCase();

        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
            <div class="comment-avatar">${avatar}</div>
            <div class="comment-body">
                <div class="comment-author">${currentUser?.display_name || currentUser?.name || 'You'}</div>
                <div class="comment-text">${text}</div>
            </div>`;
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;

        if (input) input.value = '';
        showToast('Comment posted! 💬');

    } catch (err) {
        showToast('Could not post comment.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}
// --- SHARE MODAL ---
openShareModal(postId, post) {
    this._sharePostId = postId;
    const modal      = document.getElementById('shareModal');
    const postPreview = document.getElementById('shareModalPost');
    const caption    = document.getElementById('shareCaptionInput');
    const userAvatar = document.getElementById('shareUserAvatar');

    // Show current user avatar
    const currentUser = getUser();
    if (userAvatar) {
        userAvatar.innerHTML = currentUser?.avatar_url
            ? `<img src="${currentUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : (currentUser?.display_name || currentUser?.name || 'U').charAt(0).toUpperCase();
    }

    // Show post preview
    if (postPreview) {
        const user       = post.user_id;
        const authorName = user?.display_name || user?.username || 'Anonymous';
        const avatarHtml = user?.avatar_url
            ? `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : authorName.charAt(0).toUpperCase();

        let spotifyHtml = '';
        if (post.spotify_track_url) {
            const embedUrl = post.spotify_track_url.replace('/track/', '/embed/track/');
            spotifyHtml = `
                <div style="margin-top:10px; border-radius:10px; overflow:hidden;">
                    <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                        allow="encrypted-media" loading="lazy"
                        style="border-radius:10px; display:block;"></iframe>
                </div>`;
        }

        postPreview.innerHTML = `
            <div class="smp-header">
                <div class="smp-avatar">${avatarHtml}</div>
                <div>
                    <div class="smp-author">${authorName}</div>
                    <div class="smp-time">${formatTime(post.createdAt)}</div>
                </div>
            </div>
            <div class="smp-content">${formatContent(post.content || '')}</div>
            ${spotifyHtml}`;
    }

    if (caption) caption.value = '';
    modal.classList.add('active');
    if (caption) caption.focus();
}

closeShareModal() {
    document.getElementById('shareModal')?.classList.remove('active');
    this._sharePostId = null;
}

async submitShare() {
    const postId  = this._sharePostId;
    const caption = document.getElementById('shareCaptionInput')?.value.trim() || '';
    
    if (!postId) return; // ← only block if no postId, NOT if caption is empty

    const btn = document.getElementById('shareNowBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing…'; }

    try {
        const res = await fetch(`${API}/posts/${postId}/share`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ caption }) // ← caption can be empty string
        });

        if (res.ok) {
            this.closeShareModal();
            await this.loadPosts();
            showToast('Post shared! ✨');
        }
    } catch {
        showToast('Failed to share');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-share"></i> Share now'; }
    }
}

    openModal() { this.createPostModal.classList.add('active'); this.postContent.focus(); }
    closeModal() { this.createPostModal.classList.remove('active'); this.postContent.value = ''; this.clearSelectedTrack(); this.updateCharCount(); }
    updateCharCount() { const len = this.postContent.value.length; this.charCount.textContent = len; this.postSubmit.disabled = len === 0; }
}