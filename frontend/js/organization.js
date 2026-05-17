/* =====================================================
   DearBUP – Organizations  |  organizations.js

   ROOT CAUSE FIX:
   Officers (nadel, ijkl_nop) exist in the OFFICERS
   collection but are NOT present in org.members array
   as approved members — so the old code never showed them.

   Fix: renderMembers() now fetches /api/officers/org/:id
   and MERGES those officers into the display list even
   if they are absent from org.members entirely.
   Officers are always shown first (sorted by rank).
   ===================================================== */

'use strict';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://final-project-alsor-co-bsit2a-n02f.onrender.com/api';

const CONFIG = {
  BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://final-project-alsor-co-bsit2a-n02f.onrender.com',
  USE_MOCK: false
};

const getToken  = () => localStorage.getItem('dearbup_token');
const getUserId = () => {
  const raw = localStorage.getItem('dearbup_user');
  const user = raw ? JSON.parse(raw) : null;
  return user?._id || null;
};

/* ─────────────────────────────────────────────────────
   API SERVICE LAYER
───────────────────────────────────────────────────── */
const api = {
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },
  async get(path) {
    const res = await fetch(`${CONFIG.BASE_URL}${path}`, { headers: this._headers() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
  },
  async post(path, body = {}) {
    const res = await fetch(`${CONFIG.BASE_URL}${path}`, {
      method: 'POST', headers: this._headers(), body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },
};

/* ─────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────── */
const MOCK = {
  orgs: [
    {
      _id: '1', org_name: 'BUP Computer Science Society', acronym: 'BUPCSS',
      department: 'academic', department_id: '69f0b70d2b6f2f68a4221471',
      description: 'A community of CS students fostering innovation and technical excellence.',
      logo_url: null,
      members: [
        { user_id: { _id: 'u1', display_name: 'Juan dela Cruz', username: 'jdcruz' }, role: 'president',      status: 'approved' },
        { user_id: { _id: 'u2', display_name: 'Maria Santos',   username: 'msantos' }, role: 'vice-president', status: 'approved' },
        { user_id: { _id: 'u3', display_name: 'Carlo Reyes',    username: 'creyes'  }, role: 'secretary',      status: 'approved' },
        { user_id: { _id: 'u4', display_name: 'Ana Lim',        username: 'alim'    }, role: 'member',         status: 'pending'  },
      ],
    },
  ],
  activities: {
    '1': [
      { _id: 'a1', title: 'Hackathon 2025',      description: '24-hour coding competition.', date: '2025-03-15', status: 'completed' },
      { _id: 'a2', title: 'Tech Talk: AI in PH', description: 'Guest lecture on AI.',        date: '2025-04-20', status: 'ongoing'   },
    ],
  },
};

/* ─────────────────────────────────────────────────────
   DATA FETCHING
───────────────────────────────────────────────────── */
async function fetchOrganizations(department, search) {
  if (CONFIG.USE_MOCK) {
    let data = [...MOCK.orgs];
    if (department && department !== 'all') data = data.filter(o => o.department === department);
    if (search) data = data.filter(o => o.org_name.toLowerCase().includes(search.toLowerCase()));
    return data;
  }
  const params = new URLSearchParams();
  if (department && department !== 'all') params.set('department', department);
  if (search) params.set('search', search);
  const qs = params.toString();
  return api.get(`/api/organizations${qs ? '?' + qs : ''}`);
}

async function fetchOrgById(id) {
  if (CONFIG.USE_MOCK) return MOCK.orgs.find(o => o._id === id) ?? null;
  return api.get(`/api/organizations/${id}`);
}

/* ─────────────────────────────────────────────────────
   fetchActivities — uses /api/events?org_id=xxx
───────────────────────────────────────────────────── */
async function fetchActivities(orgId) {
  if (CONFIG.USE_MOCK) return MOCK.activities[orgId] ?? [];
  try {
    const data   = await api.get(`/api/events?org_id=${orgId}&limit=20`);
    const events = Array.isArray(data) ? data : (data.data || []);
    if (!events.length) return [];
    return events.map(e => {
      let status = 'upcoming';
      if (e.is_cancelled) {
        status = 'cancelled';
      } else {
        const evtDate   = new Date(e.date); evtDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();       todayDate.setHours(0, 0, 0, 0);
        if      (evtDate < todayDate)                          status = 'completed';
        else if (evtDate.getTime() === todayDate.getTime())    status = 'ongoing';
      }
      return {
        _id:         e._id,
        title:       e.title       || '(No title)',
        description: e.content     || e.description || '',
        date:        e.date,
        venue:       e.venue       || '',
        status,
      };
    });
  } catch (err) {
    console.warn('[DearBUP] fetchActivities error:', err.message);
    return [];
  }
}

async function requestJoin(orgId) {
  if (CONFIG.USE_MOCK) {
    const org = MOCK.orgs.find(o => o._id === orgId);
    if (org) {
      const uid = getUserId() || 'currentUser';
      if (!org.members.find(m => (m.user_id?._id || m.user_id) === uid))
        org.members.push({ user_id: { _id: uid, display_name: 'You' }, role: 'member', status: 'pending' });
    }
    return { message: 'Join request sent' };
  }
  return api.post(`/api/organizations/${orgId}/join`);
}

async function requestLeave(orgId) {
  if (CONFIG.USE_MOCK) {
    const uid = getUserId() || 'currentUser';
    const org = MOCK.orgs.find(o => o._id === orgId);
    if (org) org.members = org.members.filter(m => (m.user_id?._id || m.user_id) !== uid);
    return { message: 'Left organization' };
  }
  return api.post(`/api/organizations/${orgId}/leave`);
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
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

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMembership(org) {
  const uid = getUserId();
  if (!uid) return null;
  return (org.members || []).find(m => {
    if (!m || !m.user_id) return false;
    const id = typeof m.user_id === 'object' ? m.user_id._id : m.user_id;
    return String(id) === String(uid);
  }) || null;
}

function populateSidebar() {
  try {
    const raw  = localStorage.getItem('dearbup_user');
    const user = raw ? JSON.parse(raw) : null;
    if (!user) return;
    const av = document.getElementById('sidebarAvatar');
    const nm = document.getElementById('sidebarName');
    const cr = document.getElementById('sidebarCourse');
    if (av) {
      if (user.avatar_url) {
        av.innerHTML = `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        av.textContent = (user.display_name || user.username || '?').charAt(0).toUpperCase();
      }
    }
    if (nm) nm.textContent = user.display_name || user.username || 'User';
    if (cr) cr.textContent = user.course || '';
  } catch (e) { console.warn('populateSidebar error:', e); }
}

async function initNotificationBadge() {
  const token = getToken();
  const badge = document.getElementById('notificationBadge');
  if (!token || !badge) return;
  try {
    const res = await fetch(`${API_BASE}/notifications/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const { unreadCount } = await res.json();
    badge.textContent   = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  } catch (err) { console.warn('Badge fetch failed:', err); }
}

/* ─────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ─────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────── */
let state = {
  allOrgs:      [],
  filter:       'all',
  search:       '',
  currentOrgId: null,
  currentOrg:   null,
  activities:   [],
};

/* ─────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────── */
function renderSkeletons(count = 3) {
  const grid = document.getElementById('orgsGrid');
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton-banner"></div>
      <div class="skeleton-body">
        <div class="skeleton" style="height:16px;width:65%;margin:20px 0 8px"></div>
        <div class="skeleton" style="height:12px;width:35%;margin-bottom:14px"></div>
        <div class="skeleton" style="height:12px;width:90%;margin-bottom:5px"></div>
        <div class="skeleton" style="height:12px;width:72%;margin-bottom:20px"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="skeleton" style="height:12px;width:32%"></div>
          <div class="skeleton" style="height:28px;width:26%;border-radius:50px"></div>
        </div>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────
   RENDER — ORG CARD
───────────────────────────────────────────────────── */
function buildOrgCard(org) {
  const approved = (org.members || []).filter(m => m && m.status === 'approved').length;
  const card = document.createElement('div');
  card.className = 'org-card';
  card.dataset.id = org._id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View ${org.org_name}`);

  const logoContent = org.logo_url
    ? `<img src="${org.logo_url}" alt="${org.org_name} logo" onerror="this.parentElement.textContent='${initials(org.org_name)}'">`
    : initials(org.org_name);

  card.innerHTML = `
    <div class="card-banner" style="background:${bannerGradient(org.department)}">
      <div class="card-logo">${logoContent}</div>
      <span class="dept-badge">${org.department || 'CBO'}</span>
    </div>
    <div class="card-body">
      <div class="card-name">${org.org_name}</div>
      <div class="card-acronym">${org.acronym || ''}</div>
      <div class="card-desc">${org.description || 'No description available.'}</div>
      <div class="card-meta">
        <span class="members-count"><i class="fas fa-user"></i> ${approved} member${approved !== 1 ? 's' : ''}</span>
        <button class="view-btn">View Details</button>
      </div>
    </div>`;

  const open = () => openModal(org._id);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && open());
  return card;
}

/* ─────────────────────────────────────────────────────
   LOAD & RENDER — ORG GRID
───────────────────────────────────────────────────── */
async function loadOrgs() {
  renderSkeletons(6);
  try {
    state.allOrgs = await fetchOrganizations(state.filter, state.search);
  } catch (err) {
    document.getElementById('orgsGrid').innerHTML = `
      <div class="empty-state"><i class="fas fa-exclamation-circle"></i>
      <p>Could not load organizations. Please check your connection.</p></div>`;
    return;
  }

  const grid = document.getElementById('orgsGrid');
  grid.innerHTML = '';

  if (!state.allOrgs.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>No organizations found.</p></div>`;
    return;
  }

  state.allOrgs.forEach(org => grid.appendChild(buildOrgCard(org)));

  const totalApproved = state.allOrgs.reduce(
    (sum, o) => sum + (o.members || []).filter(m => m.status === 'approved').length, 0
  );
  const totalActs = CONFIG.USE_MOCK
    ? state.allOrgs.reduce((sum, o) => sum + (MOCK.activities[o._id]?.length ?? 0), 0)
    : '—';

  document.getElementById('totalOrgs').textContent       = state.allOrgs.length;
  document.getElementById('totalMembers').textContent    = totalApproved.toLocaleString();
  document.getElementById('totalActivities').textContent = totalActs;
}

/* ─────────────────────────────────────────────────────
   MODAL — OPEN
───────────────────────────────────────────────────── */
async function openModal(orgId) {
  state.currentOrgId = orgId;
  const overlay = document.getElementById('orgOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('modalName').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  ['modalSub','modalDept','mAbout'].forEach(id => { document.getElementById(id).textContent = ''; });
  ['mMembers','mApproved','mPending'].forEach(id => { document.getElementById(id).textContent = '—'; });
  document.getElementById('membersList').innerHTML  = '';
  document.getElementById('activityList').innerHTML = '<p style="font-size:0.85rem;color:#9999aa">Loading activities…</p>';

  try {
    const org = await fetchOrgById(orgId);
    if (!org) throw new Error('Organization not found');
    state.currentOrg = org;

    let activities = [];
    try { activities = await fetchActivities(orgId); }
    catch (actErr) { console.warn('[DearBUP] Activities not available:', actErr.message); }

    state.activities = activities;
    populateModal(org, activities);
  } catch (err) {
    document.getElementById('modalName').innerHTML = 'Error loading organization';
    document.getElementById('mAbout').textContent  = err.message || 'Could not load details.';
    showToast(err.message || 'Error loading organization', 'error');
  }
}

/* ─────────────────────────────────────────────────────
   MODAL — CLOSE
───────────────────────────────────────────────────── */
function closeModal() {
  document.getElementById('orgOverlay').classList.remove('open');
  document.body.style.overflow = '';
  state.currentOrgId = null;
  state.currentOrg   = null;
  state.activities   = [];
}

/* ─────────────────────────────────────────────────────
   MODAL — POPULATE
───────────────────────────────────────────────────── */
function populateModal(org, activities) {
  document.getElementById('modalBanner').style.background = bannerGradient(org.department);

  const logoEl = document.getElementById('modalLogo');
  if (org.logo_url) {
    logoEl.innerHTML = `<img src="${org.logo_url}" alt="${org.org_name} logo" onerror="this.textContent='${initials(org.org_name)}'">`;
  } else {
    logoEl.textContent = initials(org.org_name);
  }

  document.getElementById('modalName').textContent  = org.org_name;
  document.getElementById('modalSub').textContent   = org.acronym    || '';
  document.getElementById('modalDept').textContent  = org.department || 'CBO';
  document.getElementById('mAbout').textContent     = org.description || 'No description provided.';

  const members  = org.members || [];
  const approved = members.filter(m => m.status === 'approved');
  const pending  = members.filter(m => m.status === 'pending');

  document.getElementById('mMembers').textContent  = members.length;
  document.getElementById('mApproved').textContent = approved.length;
  document.getElementById('mPending').textContent  = pending.length;

  setJoinButtonState(org);
  renderActivities(activities);
  renderMembers(approved, org._id);
}

/* ─────────────────────────────────────────────────────
   JOIN BUTTON STATE
───────────────────────────────────────────────────── */
function setJoinButtonState(org) {
  const myMembership = getMembership(org);
  const update = btn => {
    btn.disabled  = false;
    btn.className = 'follow-btn';
    if (myMembership?.status === 'approved') {
      btn.innerHTML = '<i class="fas fa-check"></i> Member';
      btn.classList.add('member'); btn.disabled = true;
    } else if (myMembership?.status === 'pending') {
      btn.innerHTML = '<i class="fas fa-clock"></i> Pending';
      btn.classList.add('pending'); btn.disabled = true;
    } else {
      btn.innerHTML = '<i class="fas fa-plus"></i> Join';
    }
  };
  update(document.getElementById('followBtn'));
  const btn2 = document.getElementById('followBtn2');
  update(btn2);
  btn2.style.flex           = '1';
  btn2.style.justifyContent = 'center';
}

/* ─────────────────────────────────────────────────────
   RENDER ACTIVITIES
   Explicit inline white background — never goes dark.
───────────────────────────────────────────────────── */
function renderActivities(activities) {
  const list = document.getElementById('activityList');
  list.innerHTML = '';

  if (!activities.length) {
    list.innerHTML = '<p style="font-size:0.82rem;color:#9999aa">No activities recorded yet.</p>';
    return;
  }

  const dotColors   = { upcoming:'#667eea', ongoing:'#f5a623', completed:'#0a6b3c', cancelled:'#d65d64' };
  const badgeStyles = {
    upcoming:  'background:#eef0ff;color:#667eea;',
    ongoing:   'background:#fff8e6;color:#b07d00;',
    completed: 'background:#edf7f1;color:#0a6b3c;',
    cancelled: 'background:#fdf0f1;color:#d65d64;',
  };

  activities.forEach(act => {
    const dotColor = dotColors[act.status]   || '#aaaaaa';
    const badgeSt  = badgeStyles[act.status] || 'background:#f0f0f0;color:#666;';
    const item     = document.createElement('div');

    item.style.cssText = `
      display:flex; gap:12px; align-items:flex-start;
      padding:14px 16px; margin-bottom:10px;
      background:#ffffff; border:1px solid #f0e8e8;
      border-radius:12px; box-shadow:0 1px 4px rgba(0,0,0,0.05);
      color:#1e1e2e;
    `;
    item.innerHTML = `
      <div style="width:10px;height:10px;border-radius:50%;background:${dotColor};
        flex-shrink:0;margin-top:5px;box-shadow:0 0 0 3px ${dotColor}33;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.88rem;color:#1e1e2e;margin-bottom:4px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${act.title}</div>
        ${act.description
          ? `<div style="font-size:0.78rem;color:#6b6b80;margin-bottom:8px;line-height:1.4;">${act.description}</div>`
          : ''}
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;">
          <span style="font-size:0.74rem;color:#9999aa;display:flex;align-items:center;gap:4px;">
            <i class="fas fa-calendar-alt" style="font-size:0.68rem;"></i> ${formatDate(act.date)}
          </span>
          ${act.venue
            ? `<span style="font-size:0.74rem;color:#9999aa;display:flex;align-items:center;gap:4px;">
                <i class="fas fa-map-marker-alt" style="font-size:0.68rem;"></i> ${act.venue}
               </span>`
            : ''}
          <span style="font-size:0.71rem;font-weight:700;padding:2px 10px;border-radius:50px;
            text-transform:capitalize;${badgeSt}">${act.status}</span>
        </div>
      </div>`;
    list.appendChild(item);
  });
}

/* ─────────────────────────────────────────────────────
   RENDER MEMBERS  ← THE REAL FIX IS HERE

   PROBLEM DISCOVERED FROM CONSOLE LOGS:
   - officerMap for Nurses' Notes has: nadel, ijkl_nop, milan rellora
   - But org.members approved list only has: "mama mo kalbo"
   - So nadel / ijkl_nop are in the OFFICERS collection but
     NOT in org.members as approved — they were never shown.

   FIX:
   1. Fetch /api/officers/org/:id to get the real officers
   2. Build a combined display list:
      a. Start with approved members from org.members
      b. For each officer, check if they're already in the list
      c. If NOT — add them at the top as an officer entry
   3. Sort: officers first, then regular members
───────────────────────────────────────────────────── */
const OFFICER_ORDER = [
  'president', 'vice-president', 'vice_president', 'vp',
  'secretary', 'treasurer', 'auditor', 'pio', 'officer',
];

async function renderMembers(approvedMembers, orgId) {
  const list = document.getElementById('membersList');
  list.innerHTML = '<p style="font-size:0.82rem;color:#9999aa">Loading members…</p>';

  /* ── Step 1: Fetch officers from the officers collection ── */
  let officers = []; // raw officer records from API
  if (!CONFIG.USE_MOCK && orgId) {
    try {
      const raw = await api.get(`/api/officers/org/${orgId}`);
      officers  = Array.isArray(raw) ? raw : [];
      console.log(`[DearBUP] Officers fetched for org ${orgId}:`, officers);
    } catch (e) {
      console.warn('[DearBUP] Officers fetch skipped:', e.message);
    }
  }

  /* ── Step 2: Build a unified display list ── */
  // Each entry: { displayName, username, role, isOfficer }

  // Start with approved org members
  const displayList = (approvedMembers || [])
    .filter(m => m && m.user_id)
    .map(m => ({
      displayName: m.user_id?.display_name || m.user_id?.username || 'Unknown',
      username:    m.user_id?.username     || '',
      _id:         String(m.user_id?._id || m.user_id || '').toLowerCase(),
      role:        (m.role || 'member').toLowerCase(),
      isOfficer:   OFFICER_ORDER.includes((m.role || '').toLowerCase()) && m.role !== 'member',
    }));

  // For each officer, add them if they're not already in the list
  officers.forEach(o => {
    const oId    = String(o.user_id?._id    || (typeof o.user_id === 'string' ? o.user_id : '')).toLowerCase();
    const oUname = String(o.user_id?.username     || '').toLowerCase();
    const oDname = String(o.user_id?.display_name || '').toLowerCase();
    const oRole  = (o.officer_role || o.role || 'officer').toLowerCase();

    // Check if this officer is already in displayList by _id or username
    const alreadyIn = displayList.some(entry =>
      (oId    && entry._id      === oId)    ||
      (oUname && entry.username === oUname) ||
      (oDname && entry.displayName.toLowerCase() === oDname)
    );

    if (!alreadyIn) {
      // Officer exists in officers collection but not in org.members — ADD THEM
      displayList.unshift({
        displayName: o.user_id?.display_name || o.user_id?.username || 'Unknown Officer',
        username:    o.user_id?.username     || oUname,
        _id:         oId,
        role:        oRole,
        isOfficer:   true,
      });
    } else {
      // Officer IS in org.members — update their role to the officer role
      const entry = displayList.find(e =>
        (oId    && e._id      === oId)    ||
        (oUname && e.username === oUname) ||
        (oDname && e.displayName.toLowerCase() === oDname)
      );
      if (entry) {
        entry.role      = oRole;
        entry.isOfficer = true;
      }
    }
  });

  /* ── Step 3: Sort — officers first by rank, then regular members ── */
  displayList.sort((a, b) => {
    const ia = OFFICER_ORDER.indexOf(a.role);
    const ib = OFFICER_ORDER.indexOf(b.role);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  /* ── Step 4: Render ── */
  list.innerHTML = '';

  if (!displayList.length) {
    list.innerHTML = '<p style="font-size:0.82rem;color:#9999aa">No members yet.</p>';
    return;
  }

  displayList.slice(0, 8).forEach(entry => {
    const badgeSt = entry.isOfficer
      ? 'background:linear-gradient(135deg,#e06a72,#d65d64);color:#fff;border:none;font-weight:700;'
      : 'background:#f5f0f0;color:#9999aa;border:1px solid #ecdede;font-weight:500;';

    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="avatar">${initials(entry.displayName)}</div>
      <div class="member-name">${entry.displayName}</div>
      <span style="
        ${badgeSt}
        font-size:0.72rem; padding:3px 12px;
        border-radius:50px; text-transform:capitalize; white-space:nowrap;
      ">${entry.role.replace(/_/g, '-')}</span>
    `;
    list.appendChild(row);
  });

  if (displayList.length > 8) {
    const more = document.createElement('p');
    more.style.cssText = 'text-align:center;font-size:0.8rem;color:#9999aa;padding:6px 0';
    more.textContent   = `+${displayList.length - 8} more members`;
    list.appendChild(more);
  }
}

/* ─────────────────────────────────────────────────────
   JOIN HANDLER
───────────────────────────────────────────────────── */
async function handleJoin() {
  if (!state.currentOrgId) return;
  try {
    const res = await requestJoin(state.currentOrgId);
    showToast(res.message || 'Join request sent!', 'success');
    const [org, activities] = await Promise.all([
      fetchOrgById(state.currentOrgId),
      fetchActivities(state.currentOrgId),
    ]);
    state.currentOrg = org;
    state.activities  = activities;
    populateModal(org, activities);
    await loadOrgs();
  } catch (err) {
    showToast(err.message || 'Could not send join request.', 'error');
  }
}

/* ─────────────────────────────────────────────────────
   SEARCH & FILTER
───────────────────────────────────────────────────── */
let searchTimer;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.search = e.target.value.trim(); loadOrgs(); }, 380);
});
document.getElementById('filterTabs').addEventListener('click', e => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  loadOrgs();
});

/* ─────────────────────────────────────────────────────
   MODAL EVENTS
───────────────────────────────────────────────────── */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('orgOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('orgOverlay')) closeModal();
});
document.getElementById('followBtn').addEventListener('click',  handleJoin);
document.getElementById('followBtn2').addEventListener('click', handleJoin);

/* ─────────────────────────────────────────────────────
   FEEDBACK MODAL
───────────────────────────────────────────────────── */
function resetFeedbackForm() {
  document.getElementById('fbCategory').value  = '';
  document.getElementById('fbText').value      = '';
  document.getElementById('anonCheck').checked = false;
}

document.getElementById('openFeedbackBtn').addEventListener('click', () => {
  if (!state.currentOrg) { showToast('No organization selected.', 'error'); return; }
  resetFeedbackForm();
  document.getElementById('feedbackOverlay').classList.add('open');
});
['closeFeedback', 'cancelFeedback'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('feedbackOverlay').classList.remove('open');
  });
});

document.getElementById('sendFeedback').addEventListener('click', async () => {
  const category    = document.getElementById('fbCategory').value;
  const message     = document.getElementById('fbText').value.trim();
  const isAnonymous = document.getElementById('anonCheck').checked;
  if (!category || !message) { showToast('Please fill in all fields.', 'error'); return; }
  if (!state.currentOrg)     { showToast('Please open an organization first.', 'error'); return; }

  const dept_id = state.currentOrg.department_id;
  if (!dept_id) { showToast('Organization department ID missing.', 'error'); return; }

  const sendBtn = document.getElementById('sendFeedback');
  sendBtn.disabled  = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
  try {
    const res = await api.post('/api/feedback', {
      dept_id, content: `${category}: ${message}`, is_anonymous: isAnonymous,
    });
    showToast(res.message || 'Feedback sent!', 'success');
    resetFeedbackForm();
    document.getElementById('feedbackOverlay').classList.remove('open');
  } catch (err) {
    showToast(err.message || 'Failed to send feedback.', 'error');
  } finally {
    sendBtn.disabled  = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
  }
});

/* ─────────────────────────────────────────────────────
   LOGOUT MODAL
───────────────────────────────────────────────────── */
function initLogoutModal() {
  const modal      = document.getElementById('logoutModal');
  const logoutBtn  = document.getElementById('logoutBtn');
  const cancelBtn  = document.getElementById('logoutCancelBtn');
  const confirmBtn = document.getElementById('logoutConfirmBtn');
  if (!modal || !logoutBtn) return;

  logoutBtn.addEventListener('click', e => { e.preventDefault(); modal.classList.add('active'); });
  cancelBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });
  confirmBtn?.addEventListener('click', () => {
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out…';
    confirmBtn.disabled  = true;
    setTimeout(() => {
      localStorage.removeItem('dearbup_token');
      localStorage.removeItem('dearbup_user');
      window.location.href = '../index.html';
    }, 600);
  });
}

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    setTimeout(() => { searchInput.value = ''; }, 300);
  }
  populateSidebar();
  initNotificationBadge();
  setInterval(initNotificationBadge, 30000);
  loadOrgs();
  initLogoutModal();
});