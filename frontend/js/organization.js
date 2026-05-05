/* =====================================================
   DearBUP – Organizations  |  organization.js
   
   API routes used (matching your Express backend):
     GET  /api/organization              → getOrganizations
     GET  /api/organization/:id          → getOrganizationById
     POST /api/organization/:id/join     → joinOrganization
     POST /api/organization/:id/leave    → leaveOrganization
   ===================================================== */

'use strict';

/* ──────────────────────────────────────────────────────
   CONFIG
   Change BASE_URL to your actual server address.
   Flip USE_MOCK to false once backend is running.
   ────────────────────────────────────────────────────── */
const CONFIG = {
  BASE_URL: 'http://localhost:5000',  // ← update to your server
  USE_MOCK:  false,                    // ← set false when backend is live
};

const getToken  = () => localStorage.getItem('dearbup_token');
const getUserId = () => {
    const raw = localStorage.getItem('dearbup_user');
    const user = raw ? JSON.parse(raw) : null;
    return user?._id || null;
};    // logged-in user _id

/* ──────────────────────────────────────────────────────
   API SERVICE LAYER
   Thin wrapper that maps to your Express routes.
   ────────────────────────────────────────────────────── */
const api = {
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async get(path) {
    const res = await fetch(`${CONFIG.BASE_URL}${path}`, {
      headers: this._headers(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async post(path, body = {}) {
    const res = await fetch(`${CONFIG.BASE_URL}${path}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },
};

/* ──────────────────────────────────────────────────────
   MOCK DATA
   Mirrors the shape your backend populates:
     CBO.populate('created_by', 'username display_name')
     CBO.populate('members.user_id', 'username display_name')
   Remove once backend is live.
   ────────────────────────────────────────────────────── */
const MOCK = {
  orgs: [
    {
      _id: '1',
      org_name: 'BUP Computer Science Society',
      acronym: 'BUPCSS',
      department: 'academic',
      department_id: '69f0b70d2b6f2f68a4221471',
      description:
        'A community of CS students fostering innovation, technical excellence, and collaborative learning across all disciplines of computing.',
      logo_url: null,
      created_by: { _id: 'u1', display_name: 'Juan dela Cruz', username: 'jdcruz' },
      members: [
        { user_id: { _id: 'u1', display_name: 'Juan dela Cruz' },   role: 'president',      status: 'approved' },
        { user_id: { _id: 'u2', display_name: 'Maria Santos' },     role: 'vice-president', status: 'approved' },
        { user_id: { _id: 'u3', display_name: 'Carlo Reyes' },      role: 'secretary',      status: 'approved' },
        { user_id: { _id: 'u4', display_name: 'Ana Lim' },          role: 'member',         status: 'pending'  },
      ],
    },
    {
      _id: '2',
      org_name: 'BUP Civic Welfare Club',
      acronym: 'BUPSWC',
      department: 'socio-civic',
      department_id: '69f0bfca2b6f2f68a422147f',
      description:
        'Dedicated to community outreach, social welfare programs, and building a culture of service among the BU Polangui student body.',
      logo_url: null,
      created_by: { _id: 'u5', display_name: 'Rosa Viernes', username: 'rviernes' },
      members: [
        { user_id: { _id: 'u5', display_name: 'Rosa Viernes' },  role: 'president',  status: 'approved' },
        { user_id: { _id: 'u6', display_name: 'Pedro Garcia' },  role: 'secretary',  status: 'approved' },
        { user_id: { _id: 'u7', display_name: 'Lea Montero' },   role: 'member',     status: 'approved' },
      ],
    },
    {
      _id: '3',
      org_name: 'BUP Cultural Arts Guild',
      acronym: 'BUPCAG',
      department: 'cultural',
      department_id: '69f0cacc2b6f2f68a4221481',
      description:
        'Preserving and promoting Filipino culture through dance, visual arts, music, and theatrical performances for the campus community.',
      logo_url: null,
      created_by: { _id: 'u8', display_name: 'Rico Buenaventura', username: 'rbuena' },
      members: [
        { user_id: { _id: 'u8',  display_name: 'Rico Buenaventura' }, role: 'president', status: 'approved' },
        { user_id: { _id: 'u9',  display_name: 'Tina Flores' },       role: 'member',    status: 'approved' },
        { user_id: { _id: 'u10', display_name: 'Ben Castro' },        role: 'member',    status: 'pending'  },
      ],
    },
    {
      _id: '4',
      org_name: 'BUP Varsity Sports Association',
      acronym: 'BUPVSA',
      department: 'sports',
      department_id: '69f0cad92b6f2f68a4221483',
      description:
        'Uniting student athletes and sports enthusiasts to represent BU Polangui in interschool competitions and promote a healthy campus lifestyle.',
      logo_url: null,
      created_by: { _id: 'u11', display_name: 'Mark Ignacio', username: 'mignacio' },
      members: [
        { user_id: { _id: 'u11', display_name: 'Mark Ignacio' },   role: 'president', status: 'approved' },
        { user_id: { _id: 'u12', display_name: 'Rina Bautista' },  role: 'treasurer', status: 'approved' },
      ],
    },
    {
      _id: '5',
      org_name: 'BUP Campus Ministry',
      acronym: 'BUPCM',
      department: 'religious',
      department_id: '69f0cae42b6f2f68a4221485',
      description:
        'A faith-based organization nurturing spiritual growth, moral formation, and community values among BU Polangui students and staff.',
      logo_url: null,
      created_by: { _id: 'u13', display_name: 'Grace Bautista', username: 'gbautista' },
      members: [
        { user_id: { _id: 'u13', display_name: 'Grace Bautista' }, role: 'president', status: 'approved' },
        { user_id: { _id: 'u14', display_name: 'Jerome Cruz' },    role: 'member',    status: 'approved' },
      ],
    },
    {
      _id: '6',
      org_name: 'BUP Engineering Society',
      acronym: 'BUPES',
      department: 'academic',
      department_id: '69f0b70d2b6f2f68a4221471',
      description:
        'Empowering engineering students through technical workshops, industry linkages, and hands-on projects that bridge academia and real-world practice.',
      logo_url: null,
      created_by: { _id: 'u15', display_name: 'Alex Tamayo', username: 'atamayo' },
      members: [
        { user_id: { _id: 'u15', display_name: 'Alex Tamayo' },   role: 'president',  status: 'approved' },
        { user_id: { _id: 'u16', display_name: 'Nica Dela Rosa' }, role: 'secretary', status: 'approved' },
        { user_id: { _id: 'u17', display_name: 'Bert Pascual' },   role: 'member',    status: 'pending'  },
      ],
    },
  ],

  activities: {
    '1': [
      { _id: 'a1', title: 'Hackathon 2025',          description: '24-hour coding competition open to all CS students.', date: '2025-03-15', status: 'completed' },
      { _id: 'a2', title: 'Tech Talk: AI in PH',     description: 'Guest lecture on AI applications in the Philippines.',  date: '2025-04-20', status: 'ongoing'   },
      { _id: 'a3', title: 'Web Dev Workshop Series', description: 'Beginner-to-advanced HTML/CSS/JS bootcamp series.',      date: '2025-05-10', status: 'upcoming'  },
    ],
    '2': [
      { _id: 'a4', title: 'Coastal Clean-up Drive', description: 'Community clean-up at Polangui River banks.', date: '2025-02-28', status: 'completed' },
      { _id: 'a5', title: 'Livelihood Seminar',      description: 'Skills training for local community members.', date: '2025-04-05', status: 'ongoing'   },
    ],
    '3': [
      { _id: 'a6', title: 'Kultura Festival', description: 'Annual cultural night showcasing Filipino arts and traditions.', date: '2025-05-20', status: 'upcoming'  },
      { _id: 'a7', title: 'Painting Exhibit', description: 'Student art showcase on the theme "Roots".',                    date: '2025-03-22', status: 'completed' },
    ],
    '4': [
      { _id: 'a8', title: 'Interschool Basketball Tournament', description: 'BU Polangui hosts regional collegiate basketball.', date: '2025-04-18', status: 'ongoing' },
    ],
    '5': [
      { _id: 'a9', title: 'Recollection Day', description: 'Annual spiritual recollection retreat for students.', date: '2025-03-08', status: 'completed' },
    ],
    '6': [
      { _id: 'a10', title: 'Engineering Week',  description: 'Week-long engineering celebration with exhibits and contests.', date: '2025-05-05', status: 'upcoming' },
      { _id: 'a11', title: 'Robotics Demo Day', description: 'Student-built robot demonstrations and judging.',               date: '2025-04-12', status: 'ongoing'  },
    ],
  },
};

/* ──────────────────────────────────────────────────────
   DATA FETCHING  (real API or mock)
   ────────────────────────────────────────────────────── */
async function fetchOrganizations(department, search) {
  if (CONFIG.USE_MOCK) {
    let data = [...MOCK.orgs];
    if (department && department !== 'all')
      data = data.filter((o) => o.department === department);
    if (search)
      data = data.filter((o) =>
        o.org_name.toLowerCase().includes(search.toLowerCase())
      );
    return data;
  }
  // Real backend: GET /api/organization?department=x&search=y
  const params = new URLSearchParams();
  if (department && department !== 'all') params.set('department', department);
  if (search) params.set('search', search);
  const qs = params.toString();
  return api.get(`/api/organization${qs ? '?' + qs : ''}`);
}

async function fetchOrgById(id) {
  if (CONFIG.USE_MOCK)
    return MOCK.orgs.find((o) => o._id === id) ?? null;
  return api.get(`/api/organization/${id}`);
}

async function fetchActivities(orgId) {
  if (CONFIG.USE_MOCK)
    return MOCK.activities[orgId] ?? [];
  
  try {
    return await api.get(`/api/organization/${orgId}/activities`);
  } catch (error) {
    // If endpoint doesn't exist (404), just return empty array
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('Activities endpoint not available yet');
      return [];
    }
    throw error;
  }
}
async function requestJoin(orgId) {
  if (CONFIG.USE_MOCK) {
    // Simulate adding a pending membership to mock data
    const org = MOCK.orgs.find((o) => o._id === orgId);
    if (org) {
      const uid = getUserId() || 'currentUser';
      const already = org.members.find(
        (m) => (m.user_id?._id || m.user_id) === uid
      );
      if (!already) {
        org.members.push({
          user_id: { _id: uid, display_name: 'You' },
          role: 'member',
          status: 'pending',
        });
      }
    }
    return { message: 'Join request sent' };
  }
  return api.post(`/api/organization/${orgId}/join`);
}

async function requestLeave(orgId) {
  if (CONFIG.USE_MOCK) {
    const uid = getUserId() || 'currentUser';
    const org = MOCK.orgs.find((o) => o._id === orgId);
    if (org)
      org.members = org.members.filter(
        (m) => (m.user_id?._id || m.user_id) !== uid
      );
    return { message: 'Left organization' };
  }
  return api.post(`/api/organization/${orgId}/leave`);
}

/* ──────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────── */
function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function bannerGradient(dept) {
  const map = {
    'Computer Studies Department': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'Engineering Department': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'Nursing Department': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'Technology Department': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'Entrepreneur Department': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'Education Department Technology': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  };
  return map[dept] || 'linear-gradient(135deg, var(--primary-light), var(--primary))';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getMembership(org) {
  const uid = getUserId();
  if (!uid) return null;
  return (org.members || []).find(
    (m) => (m.user_id?._id || m.user_id) === uid
  ) || null;
}

// ── Sidebar user population ──────────────────────────────
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
                av.innerHTML = `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            } else {
                const name = user.display_name || user.username || '?';
                av.textContent = name.charAt(0).toUpperCase();
            }
        }
        if (nm) nm.textContent = user.display_name || user.username || 'User';
        if (cr) cr.textContent = user.course || '';
    } catch (e) {
        console.warn('populateSidebar error:', e);
    }
}

// ── Logout ───────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('dearbup_token');
    localStorage.removeItem('dearbup_user');
    window.location.href = '../index.html';
});

// ── Notification badge ───────────────────────────────────
async function initNotificationBadge() {
    const token = getToken();
    const badge = document.getElementById('notificationBadge');
    if (!token || !badge) return;
    try {
        const res = await fetch(`${CONFIG.BASE_URL}/api/notifications/count`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const { unreadCount } = await res.json();
        if (unreadCount > 0) {
            badge.textContent   = unreadCount > 99 ? '99+' : String(unreadCount);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.warn('Badge fetch failed:', err);
    }
}

/* ──────────────────────────────────────────────────────
   TOAST
   ────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ──────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────── */
let state = {
  allOrgs:       [],
  filter:        'all',
  search:        '',
  currentOrgId:  null,
  currentOrg:    null,
  activities:    [],
};

/* ──────────────────────────────────────────────────────
   SKELETON LOADER
   ────────────────────────────────────────────────────── */
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
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────────
   RENDER — ORG CARD
   ────────────────────────────────────────────────────── */
function buildOrgCard(org) {
  const approved = (org.members || []).filter((m) => m.status === 'approved').length;

  const card = document.createElement('div');
  card.className = 'org-card';
  card.dataset.id = org._id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View ${org.org_name}`);

  const logoContent = org.logo_url
    ? `<img src="${org.logo_url}" alt="${org.org_name} logo"
          onerror="this.parentElement.textContent='${initials(org.org_name)}'">`
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
        <span class="members-count">
          <i class="fas fa-user"></i>
          ${approved} member${approved !== 1 ? 's' : ''}
        </span>
        <button class="view-btn">View Details</button>
      </div>
    </div>`;

  const open = () => openModal(org._id);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && open());

  return card;
}

/* ──────────────────────────────────────────────────────
   LOAD & RENDER — ORG GRID
   ────────────────────────────────────────────────────── */
async function loadOrgs() {
  renderSkeletons(6);

  try {
    state.allOrgs = await fetchOrganizations(state.filter, state.search);
  } catch (err) {
    document.getElementById('orgsGrid').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Could not load organizations. Please check your connection.</p>
      </div>`;
    console.error('[DearBUP] fetchOrganizations failed:', err);
    return;
  }

  const grid = document.getElementById('orgsGrid');
  grid.innerHTML = '';

  if (!state.allOrgs.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No organizations found.</p>
      </div>`;
    return;
  }

  state.allOrgs.forEach((org) => grid.appendChild(buildOrgCard(org)));

  // Update stats
  const totalApproved = state.allOrgs.reduce(
    (sum, o) => sum + (o.members || []).filter((m) => m.status === 'approved').length,
    0
  );
  
  // Fix: Don't use MOCK.activities when in real mode
  let totalActs = 0;
  if (CONFIG.USE_MOCK) {
    totalActs = state.allOrgs.reduce(
      (sum, org) => sum + (MOCK.activities[org._id]?.length ?? 0),
      0
    );
  } else {
    // In real mode, activities count will come from API later
    totalActs = '—';
  }

  document.getElementById('totalOrgs').textContent = state.allOrgs.length;
  document.getElementById('totalMembers').textContent = totalApproved.toLocaleString();
  document.getElementById('totalActivities').textContent = totalActs;
}

/* ──────────────────────────────────────────────────────
   MODAL — OPEN
   ────────────────────────────────────────────────────── */
async function openModal(orgId) {
  state.currentOrgId = orgId;

  const overlay = document.getElementById('orgOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Reset modal content while loading
  document.getElementById('modalName').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  document.getElementById('modalSub').textContent = '';
  document.getElementById('modalDept').textContent = '';
  document.getElementById('mAbout').textContent = '';
  ['mMembers', 'mApproved', 'mPending'].forEach((id) => {
    document.getElementById(id).textContent = '—';
  });
  document.getElementById('membersList').innerHTML = '';
  document.getElementById('activityList').innerHTML = '<p style="font-size:0.85rem;color:var(--text-light)">Loading activities…</p>';

  try {
    console.log('Fetching org with ID:', orgId);
    const org = await fetchOrgById(orgId);
    
    if (!org) {
      throw new Error('Organization not found');
    }
    
    console.log('Org loaded:', org.org_name);
    state.currentOrg = org;
    
    let activities = [];
    try {
      activities = await fetchActivities(orgId);
    } catch (actErr) {
      console.log('Activities not available:', actErr.message);
      activities = [];
    }
    state.activities = activities;
    populateModal(org, activities);
  } catch (err) {
    console.error('[DearBUP] openModal error:', err);
    document.getElementById('modalName').innerHTML = 'Error loading organization';
    document.getElementById('mAbout').innerHTML = err.message || 'Could not load organization details.';
    showToast(err.message || 'Error loading organization', 'error');
  }
}
/* ──────────────────────────────────────────────────────
   MODAL — CLOSE
   ────────────────────────────────────────────────────── */
function closeModal() {
  document.getElementById('orgOverlay').classList.remove('open');
  document.body.style.overflow = '';
  state.currentOrgId = null;
  state.currentOrg   = null;
  state.activities   = [];
}

/* ──────────────────────────────────────────────────────
   MODAL — POPULATE
   ────────────────────────────────────────────────────── */
function populateModal(org, activities) {
  // Banner
  document.getElementById('modalBanner').style.background =
    bannerGradient(org.department);

  // Logo
  const logoEl = document.getElementById('modalLogo');
  if (org.logo_url) {
    logoEl.innerHTML = `<img src="${org.logo_url}" alt="${org.org_name} logo"
      onerror="this.textContent='${initials(org.org_name)}'">`;
  } else {
    logoEl.textContent = initials(org.org_name);
  }

  // Info
  document.getElementById('modalName').textContent  = org.org_name;
  document.getElementById('modalSub').textContent   = org.acronym  || '';
  document.getElementById('modalDept').textContent  = org.department || 'CBO';
  document.getElementById('mAbout').textContent     = org.description || 'No description provided.';

  // Stats
  const members  = org.members || [];
  const approved = members.filter((m) => m.status === 'approved');
  const pending  = members.filter((m) => m.status === 'pending');

  document.getElementById('mMembers').textContent  = members.length;
  document.getElementById('mApproved').textContent = approved.length;
  document.getElementById('mPending').textContent  = pending.length;

  // Join button state
  setJoinButtonState(org);

  // Activity Tracker
  renderActivities(activities);

  // Members
  renderMembers(approved);
}

/* ──────────────────────────────────────────────────────
   JOIN BUTTON STATE
   ────────────────────────────────────────────────────── */
function setJoinButtonState(org) {
  const myMembership = getMembership(org);

  const update = (btn) => {
    btn.disabled = false;
    btn.className = 'follow-btn';

    if (myMembership?.status === 'approved') {
      btn.innerHTML  = '<i class="fas fa-check"></i> Member';
      btn.classList.add('member');
      btn.disabled   = true;
    } else if (myMembership?.status === 'pending') {
      btn.innerHTML  = '<i class="fas fa-clock"></i> Pending';
      btn.classList.add('pending');
      btn.disabled   = true;
    } else {
      btn.innerHTML = '<i class="fas fa-plus"></i> Join';
    }
  };

  update(document.getElementById('followBtn'));
  const btn2 = document.getElementById('followBtn2');
  update(btn2);
  btn2.style.flex            = '1';
  btn2.style.justifyContent  = 'center';
}

/* ──────────────────────────────────────────────────────
   RENDER — ACTIVITIES
   ────────────────────────────────────────────────────── */
function renderActivities(activities) {
  const list = document.getElementById('activityList');
  list.innerHTML = '';

  if (!activities.length) {
    list.innerHTML = '<p style="font-size:0.82rem;color:var(--text-light)">No activities recorded yet.</p>';
    return;
  }

  activities.forEach((act) => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-dot ${act.status}"></div>
      <div class="activity-info">
        <div class="activity-title">${act.title}</div>
        <div class="activity-desc">${act.description || ''}</div>
        <div class="activity-meta">
          <span class="activity-date">
            <i class="fas fa-calendar-alt"></i>
            ${formatDate(act.date)}
          </span>
          <span class="status-badge ${act.status}">${act.status}</span>
        </div>
      </div>`;
    list.appendChild(item);
  });
}

/* ──────────────────────────────────────────────────────
   RENDER — MEMBERS
   ────────────────────────────────────────────────────── */
function renderMembers(approved) {
  const list = document.getElementById('membersList');
  list.innerHTML = '';

  const preview = approved.slice(0, 6);
  preview.forEach((m) => {
    const name = m.user_id?.display_name || m.user_id?.username || 'Unknown';
    const row  = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="avatar">${initials(name)}</div>
      <div class="member-name">${name}</div>
      <span class="member-role">${m.role || 'member'}</span>`;
    list.appendChild(row);
  });

  if (approved.length > 6) {
    const more = document.createElement('p');
    more.style.cssText = 'text-align:center;font-size:0.8rem;color:var(--text-light);padding:6px 0';
    more.textContent   = `+${approved.length - 6} more members`;
    list.appendChild(more);
  }
}

/* ──────────────────────────────────────────────────────
   JOIN HANDLER
   Matches: POST /api/organization/:id/join
   ────────────────────────────────────────────────────── */
async function handleJoin() {
  if (!state.currentOrgId) return;

  try {
    const res = await requestJoin(state.currentOrgId);
    showToast(res.message || 'Join request sent!', 'success');

    // Refresh modal
    const [org, activities] = await Promise.all([
      fetchOrgById(state.currentOrgId),
      fetchActivities(state.currentOrgId),
    ]);
    state.currentOrg = org;
    state.activities  = activities;
    populateModal(org, activities);

    // Refresh cards
    await loadOrgs();
  } catch (err) {
    showToast(err.message || 'Could not send join request.', 'error');
  }
}

/* ──────────────────────────────────────────────────────
   SEARCH & FILTER
   ────────────────────────────────────────────────────── */
let searchTimer;

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    loadOrgs();
  }, 380);
});

document.getElementById('filterTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  document.querySelectorAll('.filter-tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  loadOrgs();
});

/* ──────────────────────────────────────────────────────
   MODAL EVENTS
   ────────────────────────────────────────────────────── */
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('orgOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('orgOverlay')) closeModal();
});

document.getElementById('followBtn').addEventListener('click',  handleJoin);
document.getElementById('followBtn2').addEventListener('click', handleJoin);

/* ──────────────────────────────────────────────────────
   FEEDBACK MODAL
   
   Backend route:  POST /api/feedback
   Controller:     submitFeedback (feedbackController.js)
   Auth:           authMiddleware  →  requires valid JWT in
                   localStorage as 'token'
   
   Payload sent to backend:
   {
     dept_id:      string   ← org.department_id (MongoDB ObjectId)
     content:      string   ← "Category: message" combined text
     is_anonymous: boolean  ← checkbox value
   }
   
   FIX 1 — "Invalid or expired token":
     The old handler never called api.post(), so no Authorization
     header was sent. Now we use api.post() which injects
     `Authorization: Bearer <token>` from localStorage automatically.
   
   FIX 2 — Stale form fields:
     We now clear the form every time the feedback overlay is opened,
     not just after a successful send. This means switching orgs and
     reopening the modal always shows a blank form.
   ────────────────────────────────────────────────────── */

// Helper: wipe every field in the feedback form
function resetFeedbackForm() {
  document.getElementById('fbCategory').value   = '';
  document.getElementById('fbText').value       = '';
  document.getElementById('anonCheck').checked  = false;
}

// OPEN — clear the form immediately so stale data from a previous org
// is never visible when the modal first appears
document.getElementById('openFeedbackBtn').addEventListener('click', () => {
  if (!state.currentOrg) {
    showToast('No organization selected.', 'error');
    return;
  }
  resetFeedbackForm();                                          // ← FIX 2
  document.getElementById('feedbackOverlay').classList.add('open');
});

// CLOSE / CANCEL
['closeFeedback', 'cancelFeedback'].forEach((id) => {
  document.getElementById(id).addEventListener('click', () => {
    document.getElementById('feedbackOverlay').classList.remove('open');
  });
});

// SEND  ←  POST /api/feedback  (authMiddleware required)
// SEND feedback
document.getElementById('sendFeedback').addEventListener('click', async () => {
  const category = document.getElementById('fbCategory').value;
  const message = document.getElementById('fbText').value.trim();
  const isAnonymous = document.getElementById('anonCheck').checked;

  // Validate
  if (!category || !message) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  if (!state.currentOrg) {
    showToast('Please open an organization first.', 'error');
    return;
  }

  // Get department_id from the current organization
  const dept_id = state.currentOrg.department_id;
  
  console.log('Sending feedback with:', {
    dept_id: dept_id,
    content: `${category}: ${message}`,
    is_anonymous: isAnonymous
  });
  
  if (!dept_id) {
    showToast('Organization department ID missing. Please contact admin.', 'error');
    console.error('Missing department_id for org:', state.currentOrg);
    return;
  }

  // Build payload matching backend exactly
  const payload = {
    dept_id: dept_id,
    content: `${category}: ${message}`,
    is_anonymous: isAnonymous
  };

  // Disable send button while request is in flight
  const sendBtn = document.getElementById('sendFeedback');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

  try {
    const res = await api.post('/api/feedback', payload);
    showToast(res.message || 'Feedback sent successfully!', 'success');
    resetFeedbackForm();
    document.getElementById('feedbackOverlay').classList.remove('open');
  } catch (err) {
    console.error('[DearBUP] Feedback error:', err);
    showToast(err.message || 'Failed to send feedback.', 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
  }
});

/* ──────────────────────────────────────────────────────
   MOBILE SIDEBAR TOGGLE
   ────────────────────────────────────────────────────── */
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuToggle     = document.getElementById('menuToggle');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
});

/* ──────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────── */
populateSidebar();
initNotificationBadge();
setInterval(initNotificationBadge, 30000);
loadOrgs();