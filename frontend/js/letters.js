import { API } from './config.js';
import { getToken, authHeaders } from './auth.js';
import { showToast } from './utils.js';

export class LetterManager {
    constructor() {
        this.lettersContainer = document.getElementById('lettersContainer');
        this.currentLetterIndex = 0;
        this.lettersData        = [];
        this.selectedTrack      = null;
        this.spotifySearchTimer = null;

        this.init();
    }

    init() {
        this.loadLetters();
        this.bindEvents();
        this.initLetterCompose();
        this.initStoryOverlay();
        this.initLettersDragScroll();
    }

    bindEvents() {
        document.getElementById('addLetterCard').addEventListener('click', () => this.openLetterCompose());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('letterComposeModal').classList.contains('active')) this.closeLetterCompose();
                if (document.getElementById('letterStoryOverlay').classList.contains('active')) this.closeStory();
            }
            if (document.getElementById('letterStoryOverlay').classList.contains('active')) {
                if (e.key === 'ArrowRight') this.nextLetter();
                if (e.key === 'ArrowLeft')  this.prevLetter();
            }
        });
    }

    // --- Loading & Rendering Letters ---
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

    // --- Compose Letter ---
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
            showToast('Please login to write a letter');
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

        if (!title || !content) { showToast('Please fill in the title and content.'); return; }

        const submitBtn = document.getElementById('submitLetterBtn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled  = true;

        const payload = {
            letter_title:   title,
            letter_content: content,
            letter_type:    type,
            is_anonymous:   anon,
            spotifySongName:  this.selectedTrack?.name   || null,
            spotifyArtist:    this.selectedTrack?.artist || null,
            spotifyTrackUri:  this.selectedTrack?.uri    || null,
            spotifyImageUrl:  this.selectedTrack?.art    || null
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
            showToast('Letter posted! ✉️');

        } catch (err) {
            showToast(err.message || 'Failed to post letter.');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Letter';
            submitBtn.disabled  = false;
        }
    }

    // --- Spotify ---
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
                <div class="spotify-loading-dot"></div><div class="spotify-loading-dot"></div><div class="spotify-loading-dot"></div>
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
                this.selectTrack({ name: track.name, artist: artist, art: art, uri: track.uri, url: track.external_urls?.spotify || '' });
            });
            listEl.appendChild(item);
        });
    }

    renderSpotifyEmpty() {
        document.getElementById('spotifyResultsList').innerHTML = `<div class="spotify-loading"><span style="color:#aaa">No results found</span></div>`;
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

    // --- Story Overlay ---
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
        document.getElementById('storyProgressFill').style.width = `${((this.currentLetterIndex + 1) / total) * 100}%`;

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
            document.getElementById('storySpotifyBtn').href = trackId ? `https://open.spotify.com/track/${trackId}` : '#';
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
}