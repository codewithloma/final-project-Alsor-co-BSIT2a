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

export function bootSidebar() {
    const user = getUser();
    if (!user) return;
    const name = user.name || 'You';
    document.getElementById('sidebarName').textContent    = name;
    document.getElementById('sidebarCourse').textContent  = user.course || user.role || '';
    document.getElementById('sidebarAvatar').textContent  = name.charAt(0).toUpperCase();
}