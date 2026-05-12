    /* =====================================================
    DearBUP — Admin Dashboard  |  admin-dashboard.js
    No sidebar version — top nav + back button

    ROUTES USED:
    GET    /api/organization
    GET    /api/organization/:id
    PATCH  /api/organization/:id/members/:uid/approve
    DELETE /api/organization/:id/members/:uid
    GET    /api/events
    DELETE /api/events/:id
    GET    /api/cboOfficer/org/:orgId
    POST   /api/cboOfficer/assign
    ===================================================== */

    'use strict';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/'
  : 'https://final-project-alsor-co-bsit2a-n02f.onrender.com/';

    /* ─────────────────────────────────────────────────────
    AUTH
    ───────────────────────────────────────────────────── */
    const getToken = () => localStorage.getItem('dearbup_token');
    const getUser  = () => {
    try { return JSON.parse(localStorage.getItem('dearbup_user') || 'null'); }
    catch { return null; }
    };

    function guardAdmin() {
    const user = getUser();

    if (!user) {
        showAccessDenied('You must be logged in to access this page.', 'Not Logged In');
        return false;
    }

    const ok = user.user_type === 'admin' || user.role === 'admin';
    if (!ok) {
        showAccessDenied('You do not have permission to view the Admin Dashboard.', 'Access Denied');
        return false;
    }

    return true;
    }

    function guardAdmin() {
    const user = getUser();

    if (!user) {
        showAccessDenied('You must be logged in to access this page.', 'Not Logged In');
        return false;
    }

    const ok = user.user_type === 'admin' || user.role === 'admin';
    if (!ok) {
        showAccessDenied('You do not have permission to view the Admin Dashboard.', 'Access Denied');
        return false;
    }

    return true;
    }

    function showAccessDenied(message, title) {
    document.body.innerHTML = `
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DM Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(155deg, #f0c0c2 0%, #e89090 40%, #d87878 100%);
            overflow: hidden;
        }
        .denied-card {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(20px);
            border-radius: 28px;
            padding: 52px 44px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            box-shadow: 0 24px 64px rgba(0,0,0,0.15);
            animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popIn {
            from { opacity: 0; transform: scale(0.85) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .denied-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbe8e9, #f5c0c3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 2.2rem;
        }
        .denied-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1.7rem;
            font-weight: 800;
            color: #1e1e2e;
            letter-spacing: -0.5px;
            margin-bottom: 12px;
        }
        .denied-msg {
            font-size: 0.92rem;
            color: #6b6b80;
            line-height: 1.7;
            margin-bottom: 32px;
        }
        .denied-countdown {
            font-size: 0.78rem;
            color: #a0a0b0;
            margin-bottom: 24px;
        }
        .denied-countdown span {
            font-weight: 700;
            color: #d65d64;
            font-size: 0.9rem;
        }
        .denied-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #e06a72, #d65d64);
            color: white;
            border: none;
            padding: 13px 28px;
            border-radius: 50px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            box-shadow: 0 6px 20px rgba(214, 93, 100, 0.35);
        }
        .denied-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(214, 93, 100, 0.45);
        }
        .progress-bar {
            width: 100%;
            height: 3px;
            background: #f0eeee;
            border-radius: 10px;
            margin-top: 28px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, #e06a72, #d65d64);
            border-radius: 10px;
            animation: shrink 4s linear forwards;
        }
        @keyframes shrink {
            from { width: 100%; }
            to   { width: 0%; }
        }
        </style>

        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />

        <div class="denied-card">
        <div class="denied-icon">🔒</div>
        <div class="denied-title">${title}</div>
        <div class="denied-msg">${message}</div>
        <div class="denied-countdown">Redirecting to home in <span id="countNum">4</span>s</div>
        <a href="../HTML/home.html" class="denied-btn">
            <i class="fas fa-arrow-left" style="font-size:0.8rem"></i>
            Go to Home Now
        </a>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        </div>
    `;

    // Countdown and auto redirect to home
    let secs = 4;
    const countEl = document.getElementById('countNum');
    const timer = setInterval(() => {
        secs--;
        if (countEl) countEl.textContent = secs;
        if (secs <= 0) {
        clearInterval(timer);
        window.location.replace('home.html');
        }
    }, 1000);
    }
    /* ─────────────────────────────────────────────────────
    API WRAPPER
    ───────────────────────────────────────────────────── */
    const api = {
    _headers() {
        const h = { 'Content-Type': 'application/json' };
        const t = getToken();
        if (t) h['Authorization'] = `Bearer ${t}`;
        return h;
    },
    async get(path) {
        const r = await fetch(`${BASE_URL}${path}`, { headers: this._headers() });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
        return d;
    },
    async post(path, body = {}) {
        const r = await fetch(`${BASE_URL}${path}`, {
        method: 'POST', headers: this._headers(), body: JSON.stringify(body),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
        return d;
    },
    async patch(path, body = {}) {
        const r = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH', headers: this._headers(), body: JSON.stringify(body),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
        return d;
    },
    async delete(path) {
        const r = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE', headers: this._headers(),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
        return d;
    },
    };

    /* ─────────────────────────────────────────────────────
    STATE
    ───────────────────────────────────────────────────── */
    const S = {
    orgs:           [],
    eventsPage:     1,
    currentOrgId:   null,
    _deleteEventId: null,
    _rejectCb:      null,
    };

    /* ─────────────────────────────────────────────────────
    HELPERS
    ───────────────────────────────────────────────────── */
    function initials(name = '') {
    return (name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '?').toUpperCase();
    }

    function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function eventStatus(e) {
    if (e.is_cancelled) return 'cancelled';
    const evtD   = new Date(e.date); evtD.setHours(0,0,0,0);
    const todayS = new Date();       todayS.setHours(0,0,0,0);
    const todayE = new Date();       todayE.setHours(23,59,59,999);
    if (evtD.getTime() === todayS.getTime()) return 'today';
    if (new Date(e.date) > todayE) return 'upcoming';
    return 'past';
    }

    function bannerGradient(dept) {
    const map = {
        'Computer Studies Department':     'linear-gradient(135deg,#667eea,#764ba2)',
        'Engineering Department':          'linear-gradient(135deg,#f093fb,#f5576c)',
        'Nursing Department':              'linear-gradient(135deg,#4facfe,#00f2fe)',
        'Technology Department':           'linear-gradient(135deg,#43e97b,#38f9d7)',
        'Entrepreneur Department':         'linear-gradient(135deg,#fa709a,#fee140)',
        'Education Department Technology': 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    };
    return map[dept] || 'linear-gradient(135deg,#d65d64,#e06a72)';
    }

    function el(id) { return document.getElementById(id); }
    function setText(id, val) { const e = el(id); if (e) e.textContent = val; }

    /* ─────────────────────────────────────────────────────
    TOAST
    ───────────────────────────────────────────────────── */
    let _toastTimer;
    function showToast(msg, type = '') {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = `toast show${type ? ' ' + type : ''}`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
    }

    /* ─────────────────────────────────────────────────────
    MODAL HELPERS
    ───────────────────────────────────────────────────── */
    function openModal(id)  { el(id)?.classList.add('active');    }
    function closeModal(id) { el(id)?.classList.remove('active'); }

    /* ─────────────────────────────────────────────────────
    POPULATE USER INFO IN TOP NAV
    ───────────────────────────────────────────────────── */
    function populateTopNav() {
    const user = getUser();
    if (!user) return;
    const av = el('sidebarAvatar');
    const nm = el('sidebarName');
    if (av) {
        av.innerHTML = user.avatar_url
        ? `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : initials(user.display_name || user.username || 'A');
    }
    if (nm) nm.textContent = user.display_name || user.username || 'Admin';
    }

    /* ─────────────────────────────────────────────────────
    NAVIGATION
    ───────────────────────────────────────────────────── */
    function navigateTo(sectionId) {
    document.querySelectorAll('.nav-item[data-section]').forEach(n =>
        n.classList.toggle('active', n.dataset.section === sectionId)
    );
    document.querySelectorAll('.section').forEach(s =>
        s.classList.toggle('active', s.id === `section-${sectionId}`)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (sectionId) {
        case 'overview':      loadOverview();       break;
        case 'organizations': loadOrgs();           break;
        case 'events':        loadEvents(1);        break;
        case 'members':       loadMemberRequests(); break;
        case 'officers':      loadOfficers();       break;
    }
    }

    /* ═════════════════════════════════════════════════════
    OVERVIEW
    ═════════════════════════════════════════════════════ */
    async function loadOverview() {
    try {
        const [orgs, eventsRes] = await Promise.all([
        api.get('/api/organization'),
        api.get('/api/events?limit=5&status=upcoming&sort=asc'),
        ]);

        S.orgs = orgs;

        const totalApproved = orgs.reduce((n, o) => n + (o.members||[]).filter(m => m.status==='approved').length, 0);
        const totalPending  = orgs.reduce((n, o) => n + (o.members||[]).filter(m => m.status==='pending').length,  0);

        setText('statOrgs',    orgs.length);
        setText('statPending', totalPending);
        setText('statEvents',  eventsRes.total ?? '—');
        setText('statMembers', totalApproved);

        updateNavBadges(totalPending);
        populateOrgDropdowns();

        // Pending preview
        const pendingEl  = el('overviewPending');
        const allPending = orgs.flatMap(org =>
        (org.members||[]).filter(m => m.status==='pending')
            .map(m => ({ ...m, orgName: org.org_name, orgId: org._id }))
        ).slice(0, 6);

        pendingEl.innerHTML = !allPending.length
        ? `<div class="empty-state"><i class="fas fa-check-circle"></i><p>No pending requests!</p></div>`
        : allPending.map(m => buildRequestCard(m, true)).join('');

        // Events preview
        const eventsEl = el('overviewEvents');
        const events   = eventsRes.data || [];
        eventsEl.innerHTML = !events.length
        ? `<div class="empty-state"><i class="fas fa-calendar"></i><p>No upcoming events.</p></div>`
        : events.map(e => {
            const d  = new Date(e.date);
            const st = eventStatus(e);
            return `
                <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
                <div style="background:var(--primary-pale);color:var(--primary);border-radius:10px;padding:8px 12px;text-align:center;flex-shrink:0;min-width:54px">
                    <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.1rem;font-weight:800;line-height:1">${d.getDate()}</div>
                    <div style="font-size:0.65rem;font-weight:600;text-transform:uppercase">${d.toLocaleString('en-PH',{month:'short'})}</div>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-sub);margin-top:2px">${e.org_id?.org_name || '—'} · ${e.venue || 'TBA'}</div>
                </div>
                <span class="badge badge-${st}">${st}</span>
                </div>`;
            }).join('');

    } catch (err) {
        console.error('[Admin] loadOverview:', err);
        showToast('Failed to load overview: ' + err.message, 'error');
    }
    }

    function updateNavBadges(count) {
    ['navPendingBadge','navMemberBadge'].forEach(id => {
        const b = el(id);
        if (!b) return;
        b.textContent   = count > 99 ? '99+' : count;
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
    }

    /* ═════════════════════════════════════════════════════
    ORGANIZATIONS
    ═════════════════════════════════════════════════════ */
    async function loadOrgs() {
    const grid = el('orgsGrid');
    grid.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading…</div>`;

    try {
        const search = el('orgSearch')?.value.trim() || '';
        const dept   = el('orgDeptFilter')?.value    || '';
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (dept)   params.set('department', dept);
        const qs = params.toString();

        const orgs = await api.get(`/api/organization${qs ? '?'+qs : ''}`);
        S.orgs = orgs;
        populateOrgDropdowns();

        if (!orgs.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><p>No organizations found.</p></div>`;
        return;
        }

        grid.innerHTML = orgs.map(org => {
        const approved = (org.members||[]).filter(m => m.status==='approved').length;
        const pending  = (org.members||[]).filter(m => m.status==='pending').length;
        return `
            <div class="org-card" onclick="openOrgDrawer('${org._id}')">
            <div class="org-card-banner" style="background:${bannerGradient(org.department)}">
                <div class="org-card-logo">${initials(org.org_name)}</div>
            </div>
            <div class="org-card-body">
                <div class="org-card-name">${org.org_name}</div>
                <div class="org-card-acronym">${org.acronym || ''}</div>
                <div class="org-card-meta">
                <span><i class="fas fa-users" style="color:var(--primary);margin-right:4px"></i>${approved} members</span>
                ${pending > 0
                    ? `<span style="color:#856404;font-weight:600"><i class="fas fa-clock" style="margin-right:4px"></i>${pending} pending</span>`
                    : `<span style="color:#0a6b3c;font-weight:600"><i class="fas fa-check" style="margin-right:4px"></i>All approved</span>`}
                </div>
            </div>
            </div>`;
        }).join('');

    } catch (err) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-exclamation-circle"></i><p>${err.message}</p></div>`;
    }
    }

    /* ─── ORG DRAWER ─────────────────────────────────────── */
    async function openOrgDrawer(orgId) {
    S.currentOrgId = orgId;
    el('drawerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    setText('drawerOrgName', 'Loading…');
    el('drawerStats').innerHTML   = '';
    el('drawerPending').innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i></div>`;
    el('drawerMembers').innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i></div>`;

    try {
        const org      = await api.get(`/api/organization/${orgId}`);
        const approved = (org.members||[]).filter(m => m.status==='approved');
        const pending  = (org.members||[]).filter(m => m.status==='pending');

        setText('drawerOrgName', org.org_name);

        el('drawerStats').innerHTML = `
        <div class="drawer-stat"><div class="num">${org.members?.length||0}</div><div class="lbl">Total</div></div>
        <div class="drawer-stat"><div class="num" style="color:#0a6b3c">${approved.length}</div><div class="lbl">Approved</div></div>
        <div class="drawer-stat"><div class="num" style="color:#856404">${pending.length}</div><div class="lbl">Pending</div></div>
        `;

        el('drawerPending').innerHTML = !pending.length
        ? `<div class="empty-state" style="padding:20px"><i class="fas fa-check"></i><p>No pending requests</p></div>`
        : pending.map(m => buildRequestCard({...m, orgName: org.org_name, orgId: org._id}, false)).join('');

        el('drawerMembers').innerHTML = !approved.length
        ? `<div class="empty-state" style="padding:20px"><i class="fas fa-users"></i><p>No approved members yet</p></div>`
        : approved.map(m => {
            const name   = m.user_id?.display_name || m.user_id?.username || 'Unknown';
            const userId = m.user_id?._id || m.user_id;
            return `
                <div class="member-item" id="mrow-${userId}-${orgId}">
                <div class="member-info">
                    <div class="member-name">${name}</div>
                    <div class="member-detail">${m.role || 'member'}${m.user_id?.username ? ' · @'+m.user_id.username : ''}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-danger btn-sm" onclick="confirmReject('${orgId}','${userId}','${name.replace(/'/g,"\\'")}')">
                    <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                </div>`;
            }).join('');

        const idx = S.orgs.findIndex(o => o._id === orgId);
        if (idx !== -1) S.orgs[idx] = org;

    } catch (err) {
        showToast('Failed to load org: ' + err.message, 'error');
    }
    }

    function closeDrawer() {
    el('drawerOverlay').classList.remove('open');
    document.body.style.overflow = '';
    S.currentOrgId = null;
    }

    /* ═════════════════════════════════════════════════════
    MEMBER REQUESTS
    ═════════════════════════════════════════════════════ */
    function buildRequestCard(m, showOrg) {
    const name   = m.user_id?.display_name || m.user_id?.username || 'Unknown';
    const userId = m.user_id?._id || m.user_id;
    const orgId  = m.orgId || m.org_id;
    return `
        <div class="request-item" id="req-${userId}-${orgId}">
        <div class="request-info">
            <div class="request-name">${name}</div>
            <div class="request-detail">
            ${m.user_id?.username ? '@'+m.user_id.username : ''}
            ${showOrg ? ` · ${m.orgName || ''}` : ''}
            </div>
        </div>
        <div class="request-actions">
            <button class="btn-primary btn-sm" onclick="handleApprove('${orgId}','${userId}','${name.replace(/'/g,"\\'")}')">
            <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-danger btn-sm" onclick="confirmReject('${orgId}','${userId}','${name.replace(/'/g,"\\'")}')">
            <i class="fas fa-times"></i> Reject
            </button>
        </div>
        </div>`;
    }

    async function loadMemberRequests() {
    const container = el('memberRequestsList');
    container.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading requests…</div>`;

    try {
        const orgs = await api.get('/api/organization');
        S.orgs = orgs;
        populateOrgDropdowns();

        const filterOrgId = el('memberOrgFilter')?.value || '';
        const filtered    = filterOrgId ? orgs.filter(o => o._id === filterOrgId) : orgs;

        const allPending = filtered.flatMap(org =>
        (org.members||[]).filter(m => m.status==='pending')
            .map(m => ({ ...m, orgName: org.org_name, orgId: org._id }))
        );

        updateNavBadges(allPending.length);
        setText('statPending', allPending.length);

        if (!allPending.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>No pending requests — all caught up!</p></div>`;
        return;
        }

        const groups = {};
        allPending.forEach(m => {
        if (!groups[m.orgId]) groups[m.orgId] = { name: m.orgName, items: [] };
        groups[m.orgId].items.push(m);
        });

        container.innerHTML = Object.values(groups).map(g => `
        <div style="margin-bottom:24px">
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-sub);margin-bottom:10px;display:flex;align-items:center;gap:8px">
            <i class="fas fa-users" style="color:var(--primary)"></i>
            ${g.name}
            <span style="background:var(--primary);color:#fff;padding:2px 8px;border-radius:50px;font-size:0.65rem">${g.items.length}</span>
            </div>
            ${g.items.map(m => buildRequestCard(m, false)).join('')}
        </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${err.message}</p></div>`;
    }
    }

    async function handleApprove(orgId, userId, name) {
    const card = el(`req-${userId}-${orgId}`);
    if (card) card.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
        await api.patch(`/api/organization/${orgId}/members/${userId}/approve`);
        showToast(`✓ ${name} approved!`, 'success');
        animateRemove(`req-${userId}-${orgId}`);
        syncCache(orgId, userId, 'approved');
        refreshCounters();
    } catch (err) {
        showToast('Approval failed: ' + err.message, 'error');
        if (card) card.querySelectorAll('button').forEach(b => b.disabled = false);
    }
    }

    function confirmReject(orgId, userId, name) {
    setText('confirmTitle', 'Remove Member');
    const msg = el('confirmMsg');
    if (msg) msg.textContent = `Remove "${name}" from this organization? This cannot be undone.`;
    openModal('confirmModal');

    S._rejectCb = async () => {
        closeModal('confirmModal');
        try {
        await api.delete(`/api/organization/${orgId}/members/${userId}`);
        showToast(`${name} removed.`, 'success');
        animateRemove(`req-${userId}-${orgId}`);
        animateRemove(`mrow-${userId}-${orgId}`);
        syncCache(orgId, userId, 'removed');
        refreshCounters();
        if (S.currentOrgId === orgId) openOrgDrawer(orgId);
        } catch (err) {
        showToast('Remove failed: ' + err.message, 'error');
        } finally { S._rejectCb = null; }
    };
    }

    function animateRemove(id) {
    const e = el(id);
    if (!e) return;
    e.style.transition = 'opacity 0.25s,transform 0.25s,max-height 0.3s';
    e.style.opacity    = '0';
    e.style.transform  = 'translateX(30px)';
    setTimeout(() => e.remove(), 300);
    }

    function syncCache(orgId, userId, action) {
    const org = S.orgs.find(o => o._id === orgId);
    if (!org) return;
    if (action === 'removed') {
        org.members = (org.members||[]).filter(
        m => (m.user_id?._id || m.user_id)?.toString() !== userId
        );
    } else if (action === 'approved') {
        const m = (org.members||[]).find(
        m => (m.user_id?._id || m.user_id)?.toString() === userId
        );
        if (m) m.status = 'approved';
    }
    }

    function refreshCounters() {
    const pending  = S.orgs.reduce((n,o) => n+(o.members||[]).filter(m=>m.status==='pending').length,  0);
    const approved = S.orgs.reduce((n,o) => n+(o.members||[]).filter(m=>m.status==='approved').length, 0);
    updateNavBadges(pending);
    setText('statPending', pending);
    setText('statMembers', approved);
    }

    /* ═════════════════════════════════════════════════════
    EVENTS
    ═════════════════════════════════════════════════════ */
    async function loadEvents(page = 1) {
    const tbody = el('eventsBody');
    tbody.innerHTML = `<tr><td colspan="7" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
    S.eventsPage = page;

    try {
        const search = el('eventSearch')?.value.trim() || '';
        const status = el('eventStatusFilter')?.value  || '';
        const orgId  = el('eventOrgFilter')?.value     || '';

        const params = new URLSearchParams({ page, limit: 15 });
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (orgId)  params.set('org_id', orgId);

        const res = await api.get(`/api/events?${params}`);
        setText('statEvents', res.total ?? '—');
        renderEventsTable(res.data || []);
        renderPagination(res.pages || 1, page);

        const orgSel = el('eventOrgFilter');
        if (orgSel && !orgSel.dataset.loaded) {
        if (!S.orgs.length) { S.orgs = await api.get('/api/organization'); populateOrgDropdowns(); }
        orgSel.dataset.loaded = 'true';
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${err.message}</td></tr>`;
    }
    }

    function renderEventsTable(events) {
    const tbody = el('eventsBody');
    if (!events.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No events found.</td></tr>`;
        return;
    }
    tbody.innerHTML = events.map(e => {
        const st = eventStatus(e);
        return `
        <tr>
            <td>
            <div style="font-weight:700;font-size:0.88rem">${e.title}</div>
            <div style="font-size:0.72rem;color:var(--text-sub);margin-top:2px">${e.venue||'TBA'}</div>
            </td>
            <td style="font-size:0.85rem">${e.org_id?.org_name||'—'}</td>
            <td style="font-size:0.85rem;white-space:nowrap">${formatDate(e.date)}</td>
            <td><span style="font-size:0.78rem;font-weight:600;color:var(--text-sub)">${e.event_type||'—'}</span></td>
            <td style="font-weight:700;text-align:center">${e.rsvp_users?.length||0}</td>
            <td><span class="badge badge-${st}">${st}</span></td>
            <td>
            <button class="btn-danger btn-sm" onclick="openDeleteEvent('${e._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
            </td>
        </tr>`;
    }).join('');
    }

    function renderPagination(totalPages, currentPage) {
    const wrap = el('eventsPagination');
    if (!wrap || totalPages <= 1) { if (wrap) wrap.innerHTML = ''; return; }
    let html = '';
    const s = Math.max(1, currentPage-2), e = Math.min(totalPages, currentPage+2);
    if (currentPage > 1)     html += `<button class="page-btn" onclick="loadEvents(${currentPage-1})">‹</button>`;
    for (let p = s; p <= e; p++)
        html += `<button class="page-btn${p===currentPage?' active':''}" onclick="loadEvents(${p})">${p}</button>`;
    if (currentPage < totalPages) html += `<button class="page-btn" onclick="loadEvents(${currentPage+1})">›</button>`;
    wrap.innerHTML = html;
    }

    function openDeleteEvent(id) {
    S._deleteEventId = id;
    openModal('deleteEventModal');
    }

    async function executeDeleteEvent() {
    if (!S._deleteEventId) return;
    const btn = el('deleteEventConfirm');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        await api.delete(`/api/events/${S._deleteEventId}`);
        showToast('Event deleted.', 'success');
        closeModal('deleteEventModal');
        S._deleteEventId = null;
        loadEvents(S.eventsPage);
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    }
    }

    /* ═════════════════════════════════════════════════════
    OFFICERS
    ═════════════════════════════════════════════════════ */
    async function loadOfficers() {
    const tbody = el('officersBody');
    tbody.innerHTML = `<tr><td colspan="4" class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

    try {
        if (!S.orgs.length) { S.orgs = await api.get('/api/organization'); populateOrgDropdowns(); }

        const filterOrgId = el('officerOrgFilter')?.value || '';
        const targetOrgs  = filterOrgId ? S.orgs.filter(o => o._id === filterOrgId) : S.orgs;

        const results = await Promise.allSettled(
        targetOrgs.map(org =>
            api.get(`/api/officers/org/${org._id}`)
            .then(data => (Array.isArray(data) ? data : []).map(o => ({ ...o, _orgName: org.org_name })))
            .catch(() => [])
        )
        );

        const officers = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        if (!officers.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No officers found.</td></tr>`;
        return;
        }

        tbody.innerHTML = officers.map(o => {
        const name = o.user_id?.display_name || o.display_name || o.user_id?.username || 'Unknown';
        return `
            <tr>
            <td>
                <div style="font-weight:700;font-size:0.88rem">${name}</div>
                ${o.user_id?.username ? `<div style="font-size:0.72rem;color:var(--text-sub)">@${o.user_id.username}</div>` : ''}
            </td>
            <td style="font-size:0.85rem">${o._orgName||'—'}</td>
            <td><span class="badge badge-approved" style="text-transform:capitalize">${(o.officer_role||'').replace(/_/g,' ')}</span></td>
            <td style="font-size:0.82rem;color:var(--text-sub)">${formatDate(o.createdAt)}</td>
            </tr>`;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
    }
    }

    function openAssignModal() {
    el('assignUserId').value = '';
    openModal('assignModal');
    if (!S.orgs.length) {
        api.get('/api/organization').then(orgs => { S.orgs = orgs; populateOrgDropdowns(); }).catch(()=>{});
    }
    }

    async function submitAssignOfficer() {
    const org_id       = el('assignOrg').value;
    const user_id      = el('assignUserId').value.trim();
    const officer_role = el('assignRole').value;

    if (!org_id || !user_id) { showToast('Please fill in all fields.', 'error'); return; }
    if (!/^[a-f\d]{24}$/i.test(user_id)) { showToast('Invalid User ID — must be 24-char MongoDB ObjectId.', 'error'); return; }

    const btn = el('assignSubmitBtn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning…';

    try {
    await api.post('/api/officers/assign', { org_id, user_id, officer_role });
        showToast('Officer assigned!', 'success');
        closeModal('assignModal');
        loadOfficers();
    } catch (err) {
        showToast('Failed: ' + err.message, 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Assign';
    }
    }

    /* ─────────────────────────────────────────────────────
    ORG DROPDOWNS
    ───────────────────────────────────────────────────── */
    function populateOrgDropdowns() {
    ['memberOrgFilter','officerOrgFilter','eventOrgFilter','assignOrg'].forEach(id => {
        const sel = el(id);
        if (!sel) return;
        const cur   = sel.value;
        const isReq = id === 'assignOrg';
        sel.innerHTML = (isReq ? '<option value="">Select organization…</option>' : '<option value="">All Organizations</option>')
        + S.orgs.map(o => `<option value="${o._id}">${o.org_name}</option>`).join('');
        if (cur) sel.value = cur;
    });
    }

    /* ═════════════════════════════════════════════════════
    EVENT LISTENERS
    ═════════════════════════════════════════════════════ */
    function initEventListeners() {
    // Nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(item.dataset.section);
        });
    });

    // Stat cards
    document.querySelectorAll('.stat-card[data-section]').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.section));
    });

    // View all links
    document.querySelectorAll('.btn-link[data-section]').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.section); });
    });

    // Logout
    el('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('dearbup_token');
        localStorage.removeItem('dearbup_user');
        window.location.href = '../index.html';
    });

    // Org search + filter
    let orgTimer;
    el('orgSearch')?.addEventListener('input', () => { clearTimeout(orgTimer); orgTimer = setTimeout(loadOrgs, 380); });
    el('orgDeptFilter')?.addEventListener('change', loadOrgs);

    // Event search + filters
    let evtTimer;
    el('eventSearch')?.addEventListener('input', () => { clearTimeout(evtTimer); evtTimer = setTimeout(() => loadEvents(1), 380); });
    el('eventStatusFilter')?.addEventListener('change', () => loadEvents(1));
    el('eventOrgFilter')?.addEventListener('change',    () => loadEvents(1));

    // Member filter
    el('memberOrgFilter')?.addEventListener('change', loadMemberRequests);

    // Officer filter
    el('officerOrgFilter')?.addEventListener('change', loadOfficers);

    // Assign officer
    el('assignOfficerBtn')?.addEventListener('click', openAssignModal);
    el('assignSubmitBtn')?.addEventListener('click', submitAssignOfficer);
    el('assignCancelBtn')?.addEventListener('click', () => closeModal('assignModal'));
    el('assignModalClose')?.addEventListener('click', () => closeModal('assignModal'));

    // Confirm modal
    el('confirmOkBtn')?.addEventListener('click',     () => { if (S._rejectCb) S._rejectCb(); });
    el('confirmCancelBtn')?.addEventListener('click', () => { closeModal('confirmModal'); S._rejectCb = null; });
    el('confirmClose')?.addEventListener('click',     () => { closeModal('confirmModal'); S._rejectCb = null; });

    // Delete event modal
    el('deleteEventConfirm')?.addEventListener('click', executeDeleteEvent);
    el('deleteEventCancel')?.addEventListener('click',  () => { closeModal('deleteEventModal'); S._deleteEventId = null; });
    el('deleteEventClose')?.addEventListener('click',   () => { closeModal('deleteEventModal'); S._deleteEventId = null; });

    // Drawer close
    el('drawerClose')?.addEventListener('click', closeDrawer);
    el('drawerOverlay')?.addEventListener('click', e => {
        if (e.target === el('drawerOverlay')) closeDrawer();
    });
    }

    /* ═════════════════════════════════════════════════════
    INIT
    ═════════════════════════════════════════════════════ */
    function initDashboard() {
    if (!guardAdmin()) return;
    populateTopNav();
    initEventListeners();
    navigateTo('overview');
    }

    document.addEventListener('DOMContentLoaded', initDashboard);