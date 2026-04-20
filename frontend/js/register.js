// DearBUP - Frontend Script
// IT 112 - 2A | AlSor Co | AY 2025-2026

const API_URL = "http://localhost:5000/api/auth";
const HOME_URL = "../pages/home.html";

let authModal;
let currentUser = null;
let otpSent = false;

// LOADER ANIMATION
document.body.classList.add("loading");

window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader-wrapper");
        loader.style.opacity = "0";
        document.body.classList.remove("loading");
        setTimeout(() => {
            loader.style.display = "none";
        }, 1500);
    }, 5000);
});

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    authModal = new bootstrap.Modal(document.getElementById("authModal"));
    document.getElementById("authForm").addEventListener("submit", handleAuth);
});

// SHOW AUTH MODAL
function showAuthModal(mode) {
    const title = document.getElementById("authModalTitle");
    const submitBtn = document.querySelector("#authForm button[type='submit']");
    const authText = document.getElementById("authText");

    otpSent = false;
    document.getElementById("authForm").reset();
    document.getElementById("otpField").style.display = "none";

    if (mode === "login") {
        title.textContent = "Welcome Back";
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Log In';

        document.getElementById("usernameField").style.display = "none";
        document.getElementById("studentIdField").style.display = "none";
        document.getElementById("courseField").style.display = "none";
        document.getElementById("confirmPasswordField").style.display = "none";

        authText.innerHTML = `
            New here?
            <a href="#" class="text-primary fw-semibold" onclick="toggleAuthMode()">Create account</a>
        `;
    } else {
        title.textContent = "Create Account";
        submitBtn.innerHTML = '<i class="fas fa-mobile-alt me-2"></i>Send OTP';

        document.getElementById("usernameField").style.display = "block";
        document.getElementById("studentIdField").style.display = "block";
        document.getElementById("courseField").style.display = "block";
        document.getElementById("confirmPasswordField").style.display = "block";

        authText.innerHTML = `
            Have an account?
            <a href="#" class="text-primary fw-semibold" onclick="toggleAuthMode()">Log in</a>
        `;
    }

    authModal.show();
}

// TOGGLE LOGIN <-> REGISTER
function toggleAuthMode() {
    const title = document.getElementById("authModalTitle");
    if (title.textContent.includes("Welcome")) {
        showAuthModal("register");
    } else {
        showAuthModal("login");
    }
}

// ─── Save auth data (user + token) ───────────────────────────
function saveAuthData(data) {
    localStorage.setItem("dearbup_token", data.token);
    localStorage.setItem("dearbup_user", JSON.stringify({
        id:     data.user._id,
        name:   data.user.display_name || data.user.username,
        email:  data.user.email,
        role:   data.user.user_type,
        course: data.user.course
    }));
}

// AUTH HANDLER
async function handleAuth(e) {
    e.preventDefault();

    const email    = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const isRegister = document.getElementById("authModalTitle").textContent.includes("Create");

    // ── LOGIN ─────────────────────────────────────────────────
    if (!isRegister) {
        if (!email || !password) {
            showToast("Please enter your email and password.", "error");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Login failed. Please check your credentials.", "error");
                return;
            }

            saveAuthData(data);

            showToast("Welcome back! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = HOME_URL;
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast("Server error during login. Is the backend running?", "error");
        }

        return;
    }

    // ── REGISTER STEP 1: Send OTP ─────────────────────────────
    if (!otpSent) {
        const username        = document.getElementById("authUsername").value.trim();
        const studentId       = document.getElementById("authStudentId").value.trim();
        const course          = document.getElementById("authCourse").value.trim();
        const confirmPassword = document.getElementById("authConfirmPassword").value;

        if (!email || !username || !studentId || !course || !password || !confirmPassword) {
            showToast("Please fill in all fields.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Failed to send OTP.", "error");
                return;
            }

            otpSent = true;
            document.getElementById("otpField").style.display = "block";
            document.querySelector("#authForm button[type='submit']").innerHTML =
                '<i class="fas fa-user-plus me-2"></i>Complete Registration';

            showToast("OTP sent to your email. Please check your inbox.", "success");

        } catch (error) {
            console.error(error);
            showToast("Server error while sending OTP.", "error");
        }

    // ── REGISTER STEP 2: Verify OTP + complete registration ───
    } else {
        const username  = document.getElementById("authUsername").value.trim();
        const studentId = document.getElementById("authStudentId").value.trim();
        const course    = document.getElementById("authCourse").value.trim();
        const otp       = document.getElementById("authOTP").value.trim();

        if (!otp) {
            showToast("Please enter the OTP sent to your email.", "error");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    student_id: studentId,
                    course,
                    otp,
                    user_type: "student"
                })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Registration failed.", "error");
                return;
            }

            // Registration doesn't return a token from your backend,
            // so log the user in immediately after to get one
            const loginRes = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const loginData = await loginRes.json();

            if (!loginRes.ok) {
                showToast("Registered! Please log in.", "success");
                showAuthModal("login");
                return;
            }

            saveAuthData(loginData);

            showToast("Registration successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = HOME_URL;
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast("Server error during registration.", "error");
        }
    }
}

// TOAST NOTIFICATIONS
function showToast(message, type = "info") {
    const existing = document.getElementById("dearbup-toast");
    if (existing) existing.remove();

    const colors = {
        success: "#198754",
        error:   "#dc3545",
        info:    "#0dcaf0",
        warning: "#ffc107"
    };

    const toast = document.createElement("div");
    toast.id = "dearbup-toast";
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: opacity 0.4s ease;
        max-width: 320px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}