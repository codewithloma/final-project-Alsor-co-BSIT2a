// =============================
// API CONFIG
// =============================
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://final-project-alsor-co-bsit2a-n02f.onrender.com';

// =============================
// SELECT PAGE ELEMENTS
// =============================
const eventList = document.getElementById("eventList");
const totalUpcoming = document.getElementById("totalUpcoming");
const todayEvents = document.getElementById("todayEvents");
const nextEventDate = document.getElementById("nextEventDate");
const refreshEventsBtn = document.getElementById("refreshEventsBtn");

const eventModalOverlay = document.getElementById("eventModalOverlay");
const closeEventModal = document.getElementById("closeEventModal");

const modalEventType = document.getElementById("modalEventType");
const modalEventTitle = document.getElementById("modalEventTitle");
const modalEventOrg = document.getElementById("modalEventOrg");
const modalEventDesc = document.getElementById("modalEventDesc");
const modalEventDate = document.getElementById("modalEventDate");
const modalEventTime = document.getElementById("modalEventTime");
const modalEventVenue = document.getElementById("modalEventVenue");
const modalEventStatus = document.getElementById("modalEventStatus");

// =============================
// FORMAT DATE HELPERS
// =============================
function getDay(dateValue) {
  return new Date(dateValue).getDate();
}

function getMonth(dateValue) {
  return new Date(dateValue).toLocaleString("en-PH", {
    month: "short",
  });
}

function formatFullDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// =============================
// OPEN EVENT DETAILS MODAL
// =============================
function openEventModal(event) {
  modalEventType.textContent = event.event_type || "Event";
  modalEventTitle.textContent = event.title || "Untitled Event";
  modalEventOrg.textContent = event.org_id?.org_name || "Campus Organization";
  modalEventDesc.textContent = event.content || "No description available.";
  modalEventDate.textContent = formatFullDate(event.date);
  modalEventTime.textContent = event.time || "TBA";
  modalEventVenue.textContent = event.venue || "TBA";
  modalEventStatus.textContent = event.status || "upcoming";

  eventModalOverlay.classList.add("active");
}

// =============================
// CLOSE EVENT DETAILS MODAL
// =============================
function closeModal() {
  eventModalOverlay.classList.remove("active");
}

closeEventModal?.addEventListener("click", closeModal);

eventModalOverlay?.addEventListener("click", (e) => {
  if (e.target === eventModalOverlay) {
    closeModal();
  }
});

// =============================
// LOAD EVENT STATS
// =============================
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/stats`);
    const json = await response.json();

    if (!json.success) return;

    totalUpcoming.textContent = json.data.upcoming || 0;
    todayEvents.textContent = json.data.today || 0;
  } catch (error) {
    console.error("Error loading event stats:", error);
  }
}

// =============================
// LOAD UPCOMING EVENTS
// =============================
async function loadUpcomingEvents() {
  try {
    eventList.innerHTML = `<div class="tracker-empty">Loading events...</div>`;

    const response = await fetch(
      `${API_BASE_URL}/api/events?status=upcoming&sort=asc`
    );

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message || "Failed to load events");
    }

    const events = json.data || [];

    eventList.innerHTML = "";

    if (events.length === 0) {
      nextEventDate.textContent = "--";
      eventList.innerHTML = `<div class="tracker-empty">No upcoming events available.</div>`;
      return;
    }

    nextEventDate.textContent = formatFullDate(events[0].date);

    events.forEach((event) => {
      const card = document.createElement("div");
      card.className = "tracker-event-card";

      card.innerHTML = `
        <div class="tracker-date-box">
          <div class="tracker-date-day">${getDay(event.date)}</div>
          <div class="tracker-date-month">${getMonth(event.date)}</div>
        </div>

        <div class="tracker-event-body">
          <div class="tracker-event-top">
            <div class="tracker-event-title">${event.title}</div>
            <div class="tracker-event-type">${event.event_type || "Other"}</div>
          </div>

          <div class="tracker-event-desc">
            ${event.content || "No description available."}
          </div>

          <div class="tracker-event-meta">
            <span>
              <i class="fas fa-users"></i>
              ${event.org_id?.org_name || "Campus Organization"}
            </span>

            <span>
              <i class="fas fa-clock"></i>
              ${event.time || "TBA"}
            </span>

            <span>
              <i class="fas fa-map-marker-alt"></i>
              ${event.venue || "TBA"}
            </span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        openEventModal(event);
      });

      eventList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading upcoming events:", error);

    eventList.innerHTML = `
      <div class="tracker-empty">
        Failed to load events. Make sure the backend is running and /api/events works.
      </div>
    `;

    totalUpcoming.textContent = "0";
    todayEvents.textContent = "0";
    nextEventDate.textContent = "--";
  }
}
function loadSidebarUser() {
  const user = JSON.parse(localStorage.getItem("dearbup_user"));
  if (!user) return;

  const nameEl = document.getElementById("sidebarName");
  const courseEl = document.getElementById("sidebarCourse");
  const avatarEl = document.getElementById("sidebarAvatar");

  if (nameEl) {
    nameEl.textContent = user.display_name || user.username || "User";
  }

  if (courseEl) {
    courseEl.textContent = user.course || "";
  }

  if (avatarEl) {
    if (user.avatar_url) {
      avatarEl.innerHTML = `<img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarEl.textContent = (user.display_name || user.username || "U")[0].toUpperCase();
    }
  }
}
// =============================
// REFRESH BUTTON
// =============================
refreshEventsBtn?.addEventListener("click", () => {
  loadStats();
  loadUpcomingEvents();
});

// =============================
// MOBILE SIDEBAR TOGGLE
// =============================
document.getElementById("menuToggle")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("active");
});
function initLogoutModal() {
    const modal      = document.getElementById('logoutModal');
    const box        = document.getElementById('logoutModalBox');
    const logoutBtn  = document.getElementById('logoutBtn');
    const cancelBtn  = document.getElementById('logoutCancelBtn');
    const confirmBtn = document.getElementById('logoutConfirmBtn');

    if (!modal || !logoutBtn) return;

    // Open
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
    });

    // Cancel
    cancelBtn?.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active');
    });

    // Confirm logout
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

document.addEventListener('DOMContentLoaded', initLogoutModal);
// =============================
// INITIALIZE PAGE
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadSidebarUser();   // 🔥 ADD THIS
  loadStats();
  loadUpcomingEvents();
  initLogoutModal();
});