// ── Nav Avatar Dropdown ─────────────────────────────────
(function() {
    const API = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://final-project-alsor-co-bsit2a-n02f.onrender.com/api';

    const getToken = () => localStorage.getItem('dearbup_token');
    const getUser  = () => { try { return JSON.parse(localStorage.getItem('dearbup_user') || '{}'); } catch { return {}; } };

    // Populate dropdown user info
    const user = getUser();
    const nameEl   = document.getElementById('dropdownName');
    const handleEl = document.getElementById('dropdownHandle');
    if (nameEl)   nameEl.textContent   = user.display_name || user.username || 'User';
    if (handleEl) handleEl.textContent = '@' + (user.username || 'user');

    // ── Inject Admin/Officer link if privileged ──────────
    const isAdmin   = user.user_type === 'admin'   || user.role === 'admin';
    const isOfficer = user.user_type === 'officer'  || user.role === 'officer';

    if (isAdmin || isOfficer) {
        const dropdown = document.getElementById('navDropdown');
        const profileLink = dropdown?.querySelector('a[href="profile.html"]');

        if (dropdown && profileLink) {
            const divider = document.createElement('div');
            divider.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08);';

            const adminLink = document.createElement('a');

            if (isAdmin) {
                adminLink.href = 'admin-dashboard.html';
                adminLink.innerHTML = `
                    <i class="fas fa-shield-alt" style="width:16px;text-align:center;color:#e06a72;"></i>
                    Admin Dashboard
                    <span style="margin-left:auto;font-size:10px;font-weight:700;
                                 background:rgba(224,106,114,0.15);color:#e06a72;
                                 padding:2px 7px;border-radius:50px;letter-spacing:0.3px;">ADMIN</span>`;
                adminLink.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13px;color:#e06a72;text-decoration:none;transition:background 0.15s;cursor:pointer;';
                adminLink.addEventListener('mouseenter', () => adminLink.style.background = 'rgba(224,106,114,0.08)');
                adminLink.addEventListener('mouseleave', () => adminLink.style.background = '');
            } else {
                adminLink.href = 'officer-gate.html';
                adminLink.innerHTML = `
                    <i class="fas fa-lock" style="width:16px;text-align:center;color:#a78bfa;"></i>
                    Officer Dashboard
                    <span style="margin-left:auto;font-size:10px;font-weight:700;
                                 background:rgba(167,139,250,0.15);color:#a78bfa;
                                 padding:2px 7px;border-radius:50px;letter-spacing:0.3px;">OFFICER</span>`;
                adminLink.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.7);text-decoration:none;transition:background 0.15s;cursor:pointer;';
                adminLink.addEventListener('mouseenter', () => adminLink.style.background = 'rgba(255,255,255,0.06)');
                adminLink.addEventListener('mouseleave', () => adminLink.style.background = '');
            }

            // Insert divider + link right after "My Profile"
            profileLink.after(divider);
            divider.after(adminLink);
        }
    }

    // Toggle dropdown
    const avatar   = document.getElementById('navAvatar');
    const dropdown = document.getElementById('navDropdown');

    avatar?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!document.getElementById('navAvatarWrap')?.contains(e.target)) {
            dropdown?.classList.add('hidden');
        }
    });

    // ── Change Password ─────────────────────────────────
    function showToastMsg(msg, type = '') {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'toast show' + (type ? ' ' + type : '');
        setTimeout(() => t.classList.remove('show'), 3200);
    }

    window.togglePwVis = function(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    };

    function openModal(id)  { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
    function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
        document.getElementById('currentPassword').value     = '';
        document.getElementById('newPassword').value         = '';
        document.getElementById('confirmNewPassword').value  = '';
        document.getElementById('passwordError').style.display = 'none';
        openModal('changePasswordModal');
    });

    document.getElementById('closeChangePassword')?.addEventListener('click',  () => closeModal('changePasswordModal'));
    document.getElementById('cancelChangePassword')?.addEventListener('click', () => closeModal('changePasswordModal'));
    document.getElementById('changePasswordModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('changePasswordModal')) closeModal('changePasswordModal');
    });

    document.getElementById('saveChangePassword')?.addEventListener('click', async () => {
        const current  = document.getElementById('currentPassword').value.trim();
        const newPw    = document.getElementById('newPassword').value.trim();
        const confirm  = document.getElementById('confirmNewPassword').value.trim();
        const errEl    = document.getElementById('passwordError');

        errEl.style.display = 'none';

        if (!current || !newPw || !confirm) {
            errEl.textContent = 'Please fill in all fields.';
            errEl.style.display = 'block'; return;
        }
        if (newPw.length < 6) {
            errEl.textContent = 'New password must be at least 6 characters.';
            errEl.style.display = 'block'; return;
        }
        if (newPw !== confirm) {
            errEl.textContent = 'New passwords do not match.';
            errEl.style.display = 'block'; return;
        }

        const btn = document.getElementById('saveChangePassword');
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

        try {
            const res = await fetch(`${API}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ currentPassword: current, newPassword: newPw })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');

            closeModal('changePasswordModal');
            showToastMsg('Password changed successfully! 🔒', 'success');
        } catch (err) {
            errEl.textContent = err.message || 'Could not change password.';
            errEl.style.display = 'block';
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Save Password';
        }
    });

    // ── Delete Account ──────────────────────────────────
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
        document.getElementById('deleteConfirmText').value    = '';
        document.getElementById('deleteAccountError').style.display = 'none';
        openModal('deleteAccountModal');
    });

    document.getElementById('cancelDeleteAccount')?.addEventListener('click',  () => closeModal('deleteAccountModal'));
    document.getElementById('deleteAccountModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('deleteAccountModal')) closeModal('deleteAccountModal');
    });

    document.getElementById('confirmDeleteAccount')?.addEventListener('click', async () => {
        const typed  = document.getElementById('deleteConfirmText').value.trim();
        const errEl  = document.getElementById('deleteAccountError');
        errEl.style.display = 'none';

        if (typed !== 'DELETE') {
            errEl.textContent = 'Please type DELETE exactly to confirm.';
            errEl.style.display = 'block'; return;
        }

        const btn = document.getElementById('confirmDeleteAccount');
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';

        try {
            const res = await fetch(`${API}/auth/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');

            localStorage.removeItem('dearbup_token');
            localStorage.removeItem('dearbup_user');
            window.location.href = '../index.html';
        } catch (err) {
            errEl.textContent = err.message || 'Could not delete account.';
            errEl.style.display = 'block';
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        }
    });
})();