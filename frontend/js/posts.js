import { API } from './config.js';
import { getToken, getUser, authHeaders, logout } from './auth.js';
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
        this.logoutBtn       = document.getElementById('logoutBtn');
        this._activePostId = null;
        this._sharePostId   = null;
        this._editPostId    = null;
        this._deletePostEl  = null;
        this.selectedTrack      = null;
        this.spotifySearchTimer = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPosts();
        this.initSpotifySearch();
        this.initMediaUpload();
    }

    bindEvents() {
        this.writePostBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.createPostModal.addEventListener('click', (e) => { if (e.target === this.createPostModal) this.closeModal(); });
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        this.postContent.addEventListener('input', () => this.updateCharCount());

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.createPostModal.classList.contains('active')) this.closeModal();
        });

        // Close any open post menu when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.post-menu-dropdown.open').forEach(d => d.classList.remove('open'));
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

        // Edit modal events
        document.getElementById('closeEditModal')?.addEventListener('click', () => this.closeEditModal());
        document.getElementById('editModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) this.closeEditModal();
        });
        document.getElementById('editSaveBtn')?.addEventListener('click', () => this.submitEdit());
        document.getElementById('editContent')?.addEventListener('input', () => {
            const len = document.getElementById('editContent').value.length;
            const counter = document.getElementById('editCharCount');
            if (counter) counter.textContent = len;
        });

        // Delete modal events
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('deleteModal')) this.closeDeleteModal();
        });
        document.getElementById('deleteCancelBtn')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('deleteConfirmBtn')?.addEventListener('click', () => this.submitDelete());
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
        const listEl           = document.getElementById('postSpotifyResultsList');
        const resultsContainer = document.getElementById('postSpotifyResults');
        if (!listEl || !resultsContainer) return;

        listEl.innerHTML = '';
        if (!tracks || tracks.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        resultsContainer.style.display = 'block';

        tracks.forEach(track => {
            const item = document.createElement('div');
            item.className = 'spotify-result-item';

            const albumImg = track.album?.images?.[0]?.url || '';
            const artistName = track.artists?.[0]?.name || 'Unknown Artist';

            item.innerHTML = `
                ${albumImg
                    ? `<img src="${albumImg}" alt="" />`
                    : `<div style="width:40px;height:40px;border-radius:6px;background:rgba(29,185,84,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fab fa-spotify" style="color:#1DB954;"></i>
                    </div>`
                }
                <div class="info">
                    <div class="name">${track.name}</div>
                    <div class="artist">${artistName}</div>
                </div>`;

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
    initMediaUpload() {
    const fileInput   = document.getElementById('postFileInput');
    const previewWrap = document.getElementById('mediaPreviewWrap');
    const previewImg  = document.getElementById('mediaPreviewImg');
    const removeBtn   = document.getElementById('removeMediaBtn');
    const uploadLabel = document.getElementById('mediaUploadLabel');

    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showToast('File must be under 10MB');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (file.type.startsWith('image/')) {
                previewImg.src            = ev.target.result;
                previewImg.style.display  = 'block';
            }
            previewWrap.style.display  = 'block';
            uploadLabel.style.display  = 'none';
        };
        reader.readAsDataURL(file);
        this.postSubmit.disabled = false;
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            fileInput.value           = '';
            previewImg.src            = '';
            previewWrap.style.display = 'none';
            uploadLabel.style.display = 'inline-flex';
            this.updateCharCount();
        });
    }
}

async uploadImageToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch(`${API}/upload/post-media`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        file: reader.result,
                        mediaType: file.type.startsWith('video/') ? 'video' : 'image'
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');
                resolve(data.mediaUrl);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
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

        const postUserId = user?._id || user;
        const isOwner = currentUser && (
            postUserId?.toString() === currentUser.id?.toString() ||
            postUserId === currentUser.id
        );

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

        // Store share count on the element for easy access
        const sharesCount = post.shares_count || 0;

        el.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${avatarHtml}</div>
                <div class="post-meta">
                    <div class="post-author">${authorName}</div>
                    <div class="post-handle">${authorHandle} · ${formatTime(post.createdAt)}</div>
                </div>
                ${isOwner ? `
                <div class="post-menu">
                    <button class="post-menu-btn"><i class="fas fa-ellipsis-h"></i></button>
                    <div class="post-menu-dropdown">
                        <a href="#" data-action="edit"><i class="fas fa-pen"></i> Edit post</a>
                        <a href="#" data-action="delete"><i class="fas fa-trash-alt"></i> Delete post</a>
                    </div>
                </div>` : ''}
            </div>
            ${post.content ? `<div class="post-content">${formatContent(post.content)}</div>` : ''}
            ${post.media?.url ? `
                <div class="post-media">
                    ${post.media.type === 'video'
                        ? `<video controls style="width:100%;border-radius:12px;display:block;max-height:500px;">
                            <source src="${post.media.url}" />
                        </video>`
                        : `<img src="${post.media.url}" alt=""
                            style="width:100%;border-radius:12px;display:block;max-height:600px;object-fit:contain;background:#000;"
                            loading="lazy" />`
                    }
                </div>` : ''}
            ${spotifyEmbedHtml}
            ${sharedHtml}
            <div class="post-actions-bar">
                <div class="post-action-group">
                    <a class="post-action ${alreadyLiked ? 'liked' : ''}" data-action="like" href="#">
                        <i class="${alreadyLiked ? 'fas' : 'far'} fa-heart" style="${alreadyLiked ? 'color:#e06a72;' : ''}"></i>
                        <span>${post.reactions?.length || 0}</span>
                    </a>
                    <a class="post-action" data-action="comment" href="#">
                        <i class="far fa-comment"></i>
                        <span>${post.comments?.length || 0}</span>
                    </a>
                    <a class="post-action" data-action="share" href="#">
                        <i class="fas fa-share"></i>
                        <span data-type="shares">${sharesCount}</span>
                    </a>
                </div>
            </div>`;

        // Like / comment / share actions
        el.querySelectorAll('.post-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePostAction(e, post._id, el);
            });
        });

        // Menu toggle (only rendered if isOwner)
        const menuBtn = el.querySelector('.post-menu-btn');
        const menuDropdown = el.querySelector('.post-menu-dropdown');
        if (menuBtn && menuDropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.post-menu-dropdown.open').forEach(d => {
                    if (d !== menuDropdown) d.classList.remove('open');
                });
                menuDropdown.classList.toggle('open');
            });

            menuDropdown.querySelectorAll('a').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    menuDropdown.classList.remove('open');
                    this.handlePostAction(e, post._id, el);
                });
            });
        }

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
            const res = await fetch(`${API}/posts/${postId}`, { headers: authHeaders() });
            const post = res.ok ? await res.json() : { comments: [] };
            const likeBtn = el.querySelector('[data-action="like"]');
            const isLiked = likeBtn ? likeBtn.classList.contains('liked') : false;
            // Get live share count from the DOM
            const sharesEl = el.querySelector('[data-type="shares"]');
            const sharesCount = sharesEl ? parseInt(sharesEl.textContent) || 0 : 0;
            this.openCommentModal(postId, post, isLiked, sharesCount);

        } else if (action === 'share') {
            const res = await fetch(`${API}/posts/${postId}`, { headers: authHeaders() });
            const post = res.ok ? await res.json() : {};
            this.openShareModal(postId, post);

        } else if (action === 'delete') {
            this._deletePostEl = el;
            this.openDeleteModal();

        } else if (action === 'edit') {
            const contentEl = el.querySelector('.post-content');
            const currentContent = contentEl?.innerText || '';
            this._editPostId = postId;
            this._editPostEl = el;
            this.openEditModal(currentContent);
        }
    }

    // --- EDIT MODAL ---
    openEditModal(currentContent) {
        const modal = document.getElementById('editModal');
        const textarea = document.getElementById('editContent');
        const counter = document.getElementById('editCharCount');
        if (!modal || !textarea) return;

        textarea.value = currentContent;
        if (counter) counter.textContent = currentContent.length;
        modal.classList.add('active');
        textarea.focus();
    }

    closeEditModal() {
        document.getElementById('editModal')?.classList.remove('active');
        this._editPostId = null;
        this._editPostEl = null;
    }

    async submitEdit() {
        const postId = this._editPostId;
        const el = this._editPostEl;
        const textarea = document.getElementById('editContent');
        const newContent = textarea?.value.trim();

        if (!postId || !newContent) return;

        const saveBtn = document.getElementById('editSaveBtn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

        try {
            const res = await fetch(`${API}/posts/${postId}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ content: newContent })
            });

            if (res.ok) {
                const contentEl = el?.querySelector('.post-content');
                if (contentEl) contentEl.innerHTML = formatContent(newContent)
                this.closeEditModal();
                showToast('Post updated ✨');
            } else {
                showToast('Failed to update');
            }
        } catch (err) {
            showToast('Failed to update');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'Save changes'; }
        }
    }

    // --- DELETE MODAL ---
    openDeleteModal() {
        document.getElementById('deleteModal')?.classList.add('active');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal')?.classList.remove('active');
        this._deletePostEl = null;
    }

    async submitDelete() {
        const el = this._deletePostEl;
        const postId = el?.dataset.id;
        if (!postId) return;

        const confirmBtn = document.getElementById('deleteConfirmBtn');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…'; }

        try {
            const res = await fetch(`${API}/posts/${postId}`, {
                method: 'DELETE',
                headers: authHeaders()
            });

            if (res.ok) {
                this.closeDeleteModal();
                el.style.transition = 'all 0.3s ease';
                el.style.opacity = '0';
                el.style.transform = 'translateY(-10px)';
                setTimeout(() => el.remove(), 300);
                showToast('Post deleted');
            } else {
                showToast('Failed to delete');
            }
        } catch (err) {
            showToast('Failed to delete');
        } finally {
            if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete'; }
        }
    }

    // --- MEDIA UPLOAD ---
async uploadPostMedia(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const mediaType = file.type.startsWith("video/") ? "video" : "image";

                    const res = await fetch(`${API}/upload/post-media`, {
                        method: "POST",
                        headers: authHeaders(),
                        body: JSON.stringify({ file: reader.result, mediaType }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Media upload failed");

                    resolve({ url: data.mediaUrl, type: data.mediaType });
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

    const content      = this.postContent.value.trim();
    const fileInput    = document.getElementById('postFileInput');
    const selectedFile = fileInput?.files[0];

    if (!content && !selectedFile && !this.selectedTrack) return;

    this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    this.postSubmit.disabled  = true;

    try {
        let media_url = null;

        if (selectedFile) {
            this.postSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading…';
            media_url = await this.uploadImageToCloudinary(selectedFile);
        }

        const res = await fetch(`${API}/posts`, {
            method:  'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                content,
                spotify_track_url: this.selectedTrack?.url,
                media_url,          // ← was "media: uploadedMedia"
                is_anonymous: false
            }),
        });

        if (res.ok) {
            await this.loadPosts();
            this.closeModal();
            showToast('Posted! ✨');
        } else {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create post');
        }
    } catch (err) {
        console.error('Submission error:', err);
        showToast(err.message || 'Error');
    } finally {
        this.postSubmit.innerHTML = 'Post';
        this.postSubmit.disabled  = false;
    }
}

    // --- COMMENTS ---
    openCommentModal(postId, post, isLiked = false, sharesCount = 0) {
        this._activePostId = postId;
        const modal       = document.getElementById('commentModal');
        const list        = document.getElementById('commentsList');
        const input       = document.getElementById('commentInput');
        const postPreview = document.getElementById('commentModalPost');

        if (postPreview) {
            const user       = post.user_id;
            const authorName = user?.display_name || user?.username || 'Anonymous';
            const avatarHtml = user?.avatar_url
                ? `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                : authorName.charAt(0).toUpperCase();

            let postSpotify = '';
            if (post.spotify_track_url && !post.shared_from) {
                const embedUrl = post.spotify_track_url.replace('/track/', '/embed/track/');
                postSpotify = `
                    <div style="margin-top:10px; border-radius:12px; overflow:hidden;">
                        <iframe src="${embedUrl}" width="100%" height="80" frameborder="0"
                            allowtransparency="true" allow="encrypted-media" loading="lazy"
                            style="border-radius:12px; display:block;"></iframe>
                    </div>`;
            }

            let sharedHtml = '';
            if (post.shared_from && post.shared_from._id) {
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
            ${post.content ? `<div class="cmp-content">${formatContent(post.content)}</div>` : ''}
            ${post.media?.url ? `
                <div style="margin-top:10px;border-radius:12px;overflow:hidden;background:#000;text-align:center;">
                    ${post.media.type === 'video'
                        ? `<video controls style="width:100%;max-height:300px;border-radius:12px;display:block;">
                            <source src="${post.media.url}" />
                        </video>` 
                        : `<img src="${post.media.url}" alt=""
                            style="max-width:100%;max-height:300px;width:auto;height:auto;display:block;margin:0 auto;border-radius:12px;object-fit:contain;"
                            loading="lazy" />`
                    }
                </div>` : ''}
            ${postSpotify}
            ${sharedHtml}
            <div class="cmp-stats">
                <span class="post-action ${isLiked ? 'liked' : ''}" data-action="like" style="cursor:pointer">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart" style="${isLiked ? 'color:#e06a72;' : ''}"></i>
                    ${post.reactions?.length || 0}
                </span>
                <span><i class="far fa-comment"></i> ${post.comments?.length || 0} ${post.comments?.length === 1 ? 'comment' : 'comments'}</span>
                <span><i class="fas fa-share"></i> ${sharesCount} ${sharesCount === 1 ? 'share' : 'shares'}</span>
             </div>`;
        }

        const inputAvatar = document.getElementById('commentInputAvatar');
        if (inputAvatar) {
            const currentUser = getUser();
            inputAvatar.innerHTML = currentUser?.avatar_url
                ? `<img src="${currentUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                : (currentUser?.display_name || currentUser?.name || 'U').charAt(0).toUpperCase();
        }

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
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await fetch(`${API}/posts/${postId}/comment`, {
                method:  'POST',
                headers: authHeaders(),
                body:    JSON.stringify({ text })
            });

            if (!res.ok) throw new Error('Comment failed');

            const comments = await res.json();

            const postEl  = document.querySelector(`.post[data-id="${postId}"]`);
            const countEl = postEl?.querySelector('[data-action="comment"] span');
            if (countEl) countEl.textContent = comments.length;

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
                    <div class="comment-bubble">
                        <div class="comment-author">${currentUser?.display_name || currentUser?.name || 'You'}</div>
                        <div class="comment-text">${text}</div>
                    </div>
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
        const modal       = document.getElementById('shareModal');
        const postPreview = document.getElementById('shareModalPost');
        const caption     = document.getElementById('shareCaptionInput');
        const userAvatar  = document.getElementById('shareUserAvatar');

        const currentUser = getUser();
        if (userAvatar) {
            userAvatar.innerHTML = currentUser?.avatar_url
                ? `<img src="${currentUser.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
                : (currentUser?.display_name || currentUser?.name || 'U').charAt(0).toUpperCase();
        }

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
        if (!postId) return;

        const btn = document.getElementById('shareNowBtn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing…'; }

        try {
            const res = await fetch(`${API}/posts/${postId}/share`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ caption })
            });

            if (res.ok) {
                // Update share count on the original post card
                const postEl = document.querySelector(`.post[data-id="${postId}"]`);
                const sharesEl = postEl?.querySelector('[data-type="shares"]');
                if (sharesEl) sharesEl.textContent = parseInt(sharesEl.textContent || '0') + 1;

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
closeModal() {
    this.createPostModal.classList.remove('active');
    this.postContent.value = '';
    this.clearSelectedTrack();
    this.updateCharCount();

    const fileInput   = document.getElementById('postFileInput');
    const previewWrap = document.getElementById('mediaPreviewWrap');
    const previewImg  = document.getElementById('mediaPreviewImg');
    const uploadLabel = document.getElementById('mediaUploadLabel');
    if (fileInput)   fileInput.value           = '';
    if (previewImg)  previewImg.src            = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (uploadLabel) uploadLabel.style.display = 'inline-flex';
}
updateCharCount() {
    const len     = this.postContent.value.length;
    this.charCount.textContent = len;
    const hasFile = !!document.getElementById('postFileInput')?.files[0];
    this.postSubmit.disabled  = (len === 0 && !hasFile && !this.selectedTrack);
}
}