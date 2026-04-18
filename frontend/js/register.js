// DearBUP - Frontend Script
// IT 112 - 2A | AlSor Co | AY 2025-2026
// LOADER ANIMATION
document.body.classList.add('loading');

window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader-wrapper');

        loader.style.opacity = '0';
        document.body.classList.remove('loading');

        setTimeout(() => {
            loader.style.display = 'none';
        }, 1500);
    }, 5000);
});
// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    authModal = new bootstrap.Modal(document.getElementById('authModal'));
    createPostModal = new bootstrap.Modal(document.getElementById('createPostModal'));
    
    loadUser();
    renderPosts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Auth form
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);
    
    // Smooth scrolling for navbar links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// User Authentication
let generatedOTP = null;
let tempUserData = null;

async function handleAuth(e) {
    e.preventDefault();

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const username = document.getElementById('authUsername').value.trim();
    const studentId = document.getElementById('authStudentId').value.trim().toUpperCase();
    const course = document.getElementById('authCourse').value.trim();
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    const otpInput = document.getElementById('authOTP').value;

    const isRegister = document.getElementById('authModalTitle').textContent.includes('Create');

    // ================= REGISTER =================
    if (isRegister) {
        // Enhanced Validation
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        if (!username) {
            showToast('Username is required!', 'error');
            return;
        }
        
        if (!studentId) {
            showToast('Student ID is required!', 'error');
            return;
        }
        
        if (!course) {
            showToast('Course is required!', 'error');
            return;
        }

        // STEP 1: SEND OTP
        if (!generatedOTP) {
            try {
                const res = await fetch('http://localhost:3000/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (data.success) {
                    generatedOTP = data.otp;
                    tempUserData = { email, password, username, studentId, course };

                    document.getElementById('otpField').style.display = 'block';

                    showToast('OTP sent to your email!', 'success');
                } else {
                    showToast('Failed to send OTP', 'error');
                }

            } catch (err) {
                showToast('Server error. Make sure backend is running.', 'error');
            }

            return;
        }

        // STEP 2: VERIFY OTP
        if (otpInput == generatedOTP) {
            currentUser = {
                id: Date.now(),
                name: username,
                email: email,
                studentId: studentId,
                course: course.charAt(0).toUpperCase() + course.slice(1).toLowerCase(), // Proper case
                role: 'Student'
            };

            saveUser();
            updateUI();
            authModal.hide();

            generatedOTP = null;

            showToast(`Welcome to DearBUP, ${username}! ✨`, 'success');
        } else {
            showToast('Invalid OTP', 'error');
        }

    } 
    // ================= LOGIN =================
    else {
        showToast('Login not connected to database yet', 'info');
    }
}

function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    const usernameField = document.getElementById('usernameField');
    const studentIdField = document.getElementById('studentIdField');
    const courseField = document.getElementById('courseField');
    const confirmPasswordField = document.getElementById('confirmPasswordField');
    const otpField = document.getElementById('otpField');
    const submitBtn = document.querySelector('#authForm button');
    const authText = document.getElementById('authText');
    const toggleLink = document.getElementById('toggleAuthLink');

    // Reset OTP when switching modes
    generatedOTP = null;
    document.getElementById('authOTP').value = '';

    if (title.textContent.includes('Welcome') || title.textContent.includes('Back')) {
        // SWITCH TO REGISTER MODE
        title.textContent = 'Create Account';
        submitBtn.innerHTML = '<i class="fas fa-mobile-alt me-2"></i>Send OTP';
        
        // SHOW REGISTER FIELDS
        usernameField.style.display = 'block';
        studentIdField.style.display = 'block';
        courseField.style.display = 'block';
        confirmPasswordField.style.display = 'block';
        otpField.style.display = 'none';

        // UPDATE BOTTOM TEXT: "Have an Account? Log in"
        authText.innerHTML = `
            Have an account? 
            <a href="#" class="text-primary fw-semibold" onclick="toggleAuthMode()" id="toggleAuthLink">Log in</a>
        `;

    } else {
        // SWITCH TO LOGIN MODE
        title.textContent = 'Welcome Back';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Log In';

        // HIDE REGISTER FIELDS
        usernameField.style.display = 'none';
        studentIdField.style.display = 'none';
        courseField.style.display = 'none';
        confirmPasswordField.style.display = 'none';
        otpField.style.display = 'none';

        // UPDATE BOTTOM TEXT: "New here? Create account"
        authText.innerHTML = `
            New here? 
            <a href="#" class="text-primary fw-semibold" onclick="toggleAuthMode()" id="toggleAuthLink">Create account</a>
        `;
    }
}

// User Management
function loadUser() {
    const userData = localStorage.getItem('dearbup_user');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUI();
    }
}

function saveUser() {
    localStorage.setItem('dearbup_user', JSON.stringify(currentUser));
}

function logout() {
    localStorage.removeItem('dearbup_user');
    currentUser = null;
    updateUI();
    showToast('Logged out successfully', 'info');
}

function updateUI() {
    const userNav = document.getElementById('userNav');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const profileName = document.getElementById('profileName');
    const userRole = document.getElementById('userRole');
    
    if (currentUser) {
        userNav.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle btn-sm rounded-pill px-3" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user me-1"></i>
                    <span>${currentUser.name}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" onclick="showCreatePostModal()"><i class="fas fa-feather me-2"></i>Create Post</a></li>
                    <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
        if (userProfile) {
            userProfile.classList.remove('d-none');
            profileName.textContent = `Welcome back, ${currentUser.name}!`;
            userRole.textContent = currentUser.role;
        }
    } else {
        userNav.innerHTML = `
            <button class="btn btn-outline-primary btn-sm login-btn" onclick="showAuthModal('login')">
                <i class="fas fa-sign-in-alt me-1"></i>Login
            </button>
        `;
        if (userProfile) userProfile.classList.add('d-none');
    }
}

// Posts Management
function renderPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = posts.map(post => createPostHTML(post)).join('');
    
    // Add event listeners to like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleLike(this.dataset.postId);
        });
    });
}

function createPostHTML(post) {
    const imageContent = post.image ? 
        `<div class="post-image"><i class="fas fa-camera fa-3x"></i></div>` : 
        `<div class="post-image"><i class="fas fa-heart fa-3x"></i></div>`;
    
    return `
        <div class="col-lg-6 col-xl-4 fade-in-up">
            <div class="post-card h-100">
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">${post.author.avatar}</div>
                        <div>
                            <div class="fw-bold">${post.author.name}</div>
                            <small class="opacity-75">${post.author.role} • ${post.date}</small>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <h5 class="fw-bold mb-3">${post.title}</h5>
                    <p class="text-muted mb-0">${post.content}</p>
                </div>
                ${imageContent}
                <div class="post-actions">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex gap-3">
                            <button class="action-btn like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
                                <i class="fas ${post.liked ? 'fas fa-heart' : 'far fa-heart'} me-1"></i>
                                ${post.likes}
                            </button>
                            <button class="action-btn">
                                <i class="far fa-comment me-1"></i>${post.comments}
                            </button>
                        </div>
                        <small class="text-muted">${formatTime(post.date)}</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleCreatePost(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to create a post', 'error');
        authModal.show();
        return;
    }
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const image = document.getElementById('postImage').files[0];
    const music = document.getElementById('postMusic').value;
    
    const newPost = {
        id: Date.now(),
        title,
        content,
        author: {
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: currentUser.role
        },
        image: image ? 'image' : null,
        musicLink: music || null,
        likes: 0,
        comments: 0,
        liked: false,
        date: 'Just now'
    };
    
    posts.unshift(newPost);
    renderPosts();
    
    // Reset form
    e.target.reset();
    createPostModal.hide();
    
    showToast('Story shared successfully! ✨', 'success');
    scrollToPosts();
}

// Post Interactions
function toggleLike(postId) {
    const post = posts.find(p => p.id == postId);
    if (!post) return;
    
    if (post.liked) {
        post.likes--;
        post.liked = false;
    } else {
        post.likes++;
        post.liked = true;
    }
    
    renderPosts();
    savePosts();
}

function savePosts() {
    localStorage.setItem('dearbup_posts', JSON.stringify(posts));
}

// UI Utilities
function showAuthModal(mode) {
    document.getElementById('authEmail').value = '';
    document.getElementById('authUsername').value = '';
    document.getElementById('authStudentId').value = '';
    document.getElementById('authCourse').value = '';
    document.getElementById('authOTP').value = '';

    generatedOTP = null;
    document.getElementById('otpField').style.display = 'none';

    if (mode === 'register') {
        const title = document.getElementById('authModalTitle');
        if (!title.textContent.includes('Create')) {
            toggleAuthMode();
        }
    }

    authModal.show();
}

function showCreatePostModal() {
    if (!currentUser) {
        showToast('Please login to create posts', 'error');
        authModal.show();
        return;
    }
    createPostModal.show();
}

function scrollToPosts() {
    document.getElementById('posts').scrollIntoView({ behavior: 'smooth' });
}

function formatTime(dateString) {
    const now = new Date();
    const postTime = new Date(dateString);
    const diff = Math.floor((now - postTime) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
}

function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Load posts from localStorage on init
function initPosts() {
    const savedPosts = localStorage.getItem('dearbup_posts');
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
        renderPosts();
    }
}

// Initialize everything
initPosts();