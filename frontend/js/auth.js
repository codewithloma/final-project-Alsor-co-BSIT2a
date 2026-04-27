export function getToken() {
    return localStorage.getItem('dearbup_token');
}

export function getUser() {
    const raw = localStorage.getItem('dearbup_user');
    return raw ? JSON.parse(raw) : null;
}

export function logout() {
    localStorage.removeItem('dearbup_token');
    localStorage.removeItem('dearbup_user');
    window.location.href = '../../index.html';
}

export function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

export function guardAuth() {
    if (!getToken() || !getUser()) {
        window.location.href = '../../index.html';
    }
}
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name[0] || "?").toUpperCase();
}

export function bootSidebar() {
  const user = JSON.parse(localStorage.getItem("dearbup_user") || "null");
  if (!user) return;

  const av = document.getElementById("sidebarAvatar");
  const nm = document.getElementById("sidebarName");
  const cr = document.getElementById("sidebarCourse");

  if (av) {
    if (user.avatar_url) {
      // ← THIS is likely missing — add the img tag
      av.innerHTML = `<img src="${user.avatar_url}" alt="" 
        style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      av.textContent = getInitials(user.display_name || user.username || "?");
    }
  }
  if (nm) nm.textContent = user.display_name || user.name || user.username || "User";
  if (cr) cr.textContent = user.course || "";
}