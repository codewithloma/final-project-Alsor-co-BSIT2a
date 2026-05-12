// ============================================================
//  DearBUP – panels.js
//  Loads Organizations + Activity Tracker into home page panels
//  IT 112 – 2A | AlSor Co | AY 2025-2026
// ============================================================
import { API } from './config.js';

const API_BASE = API;
const getToken = () => localStorage.getItem('dearbup_token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

// ── Helpers ───────────────────────────────────────────────
function gradientForDept(dept = '') {
    const d = dept.toLowerCase();
    if (d.includes('computer') || d.includes('tech')) return 'linear-gradient(135deg,#667eea,#764ba2)';
    if (d.includes('nursing'))      return 'linear-gradient(135deg,#4facfe,#00f2fe)';
    if (d.includes('engineer'))     return 'linear-gradient(135deg,#f093fb,#f5576c)';
    if (d.includes('entrepreneur')) return 'linear-gradient(135deg,#fa709a,#fee140)';
    if (d.includes('education'))    return 'linear-gradient(135deg,#a18cd1,#fbc2eb)';
    return 'linear-gradient(135deg,#e06a72,#d65d64)';
}

function orgInitials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function formatShortDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ── Load Organizations Panel ──────────────────────────────
async function loadOrgsPanel() {
    const panel = document.getElementById('orgsPanel');
    if (!panel) return;

    try {
        const res  = await fetch(`${API_BASE}/organization`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw  = await res.json();
        const orgs = Array.isArray(raw) ? raw : (raw.organizations || raw.data || []);

        if (!orgs.length) {
            panel.innerHTML = '<div class="orgs-empty">No organizations yet.</div>';
            return;
        }

        const items = orgs.slice(0, 7).map(org => {
            const logoHtml = org.logo_url
                ? `<img src="${org.logo_url}" alt="" />`
                : orgInitials(org.org_name);
            return `
                <a class="org-item" href="organization.html">
                    <div class="org-logo" style="background:${gradientForDept(org.department)}">${logoHtml}</div>
                    <div class="org-info">
                        <div class="org-name">${org.org_name || 'Organization'}</div>
                        <div class="org-dept">${org.department || 'CBO'}</div>
                    </div>
                </a>`;
        }).join('');

        const seeMore = orgs.length > 7
            ? `<div class="panel-divider"></div>
               <a href="organization.html" class="panel-see-all" style="display:block;text-align:center;padding:6px 4px;border-radius:8px;">
                   See all ${orgs.length} organizations →
               </a>`
            : '';

        panel.innerHTML = items + seeMore;
    } catch (err) {
        console.error('[Panels] orgs error:', err);
        panel.innerHTML = '<div class="orgs-empty">Could not load organizations.</div>';
    }
}

// ── Load Activities Panel ─────────────────────────────────
async function loadActivitiesPanel() {
    const panel = document.getElementById('activitiesPanel');
    if (!panel) return;

    try {
        const res  = await fetch(`${API_BASE}/events?sort=asc`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const events = json.data || json.events || (Array.isArray(json) ? json : []);

        if (!events.length) {
            panel.innerHTML = '<div class="acts-empty">No upcoming activities.</div>';
            return;
        }

        panel.innerHTML = events.slice(0, 6).map(ev => {
            const status     = (ev.status || 'upcoming').toLowerCase();
            const dotClass   = `dot-${status}`;
            const badgeClass = `badge-${status}`;
            const dateStr    = formatShortDate(ev.date);
            const orgName    = ev.org_id?.org_name || ev.organization || '';

            return `
                <div class="activity-item">
                    <div class="act-dot ${dotClass}"></div>
                    <div class="act-info">
                        <div class="act-title">${ev.title || 'Event'}</div>
                        ${orgName ? `<div class="act-org">${orgName}</div>` : ''}
                        <div class="act-meta">
                            ${dateStr ? `<span class="act-date">📅 ${dateStr}</span>` : ''}
                            <span class="act-badge ${badgeClass}">${status}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('[Panels] activities error:', err);
        panel.innerHTML = '<div class="acts-empty">Could not load activities.</div>';
    }
}

// ── Update navbar avatar ──────────────────────────────────
function initNavAvatar() {
    const user = JSON.parse(localStorage.getItem('dearbup_user') || '{}');
    const navAv = document.getElementById('navAvatar');
    const createAv = document.getElementById('createAvatar');

    if (!navAv) return;

    if (user.avatar_url) {
        const imgHtml = `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        navAv.innerHTML = imgHtml;
        if (createAv) createAv.innerHTML = imgHtml;
    } else {
        const letter = (user.display_name || user.username || 'U')[0].toUpperCase();
        navAv.textContent = letter;
        if (createAv) createAv.textContent = letter;
    }
}

// ── Wire create-post triggers ─────────────────────────────
function initCreatePostTrigger() {
    const openModal = () => document.getElementById('createPostModal')?.classList.add('active');

    document.getElementById('writePostBtn')?.addEventListener('click', openModal);

    document.getElementById('writePostBtnPhoto')?.addEventListener('click', () => {
        openModal();
        setTimeout(() => document.getElementById('postFileInput')?.click(), 150);
    });

    document.getElementById('writePostBtnSong')?.addEventListener('click', () => {
        openModal();
        setTimeout(() => document.getElementById('postSpotifyInput')?.focus(), 150);
    });
}

// ── Logout ────────────────────────────────────────────────
function initLogoutModal() {
    const modal      = document.getElementById('logoutModal');
    const logoutBtn  = document.getElementById('logoutBtn');
    const cancelBtn  = document.getElementById('logoutCancelBtn');
    const confirmBtn = document.getElementById('logoutConfirmBtn');

    if (!modal || !logoutBtn) return;

    // REMOVE old inline logout handlers
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

    // OPEN MODAL
    newLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        modal.style.display = 'flex';

        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });

    // CLOSE MODAL
    function closeModal() {
        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }

    cancelBtn?.addEventListener('click', closeModal);

    // CLICK OUTSIDE
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // ESC KEY
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // CONFIRM LOGOUT
    confirmBtn?.addEventListener('click', () => {
        confirmBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Logging out...';

        confirmBtn.disabled = true;

        setTimeout(() => {
            localStorage.removeItem('dearbup_token');
            localStorage.removeItem('dearbup_user');

            window.location.href = '../index.html';
        }, 700);
    });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNavAvatar();
    initCreatePostTrigger();
    initLogoutModal();
    loadOrgsPanel();
    loadActivitiesPanel();
});