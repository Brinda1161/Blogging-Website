document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = 'https://blogging-website-1-dzzg.onrender.com';
    const BASE_PATH = '';

    // Buttons
    const loginBtn = document.querySelector("#login");
    const signupBtn = document.querySelector("#signup");
    const startBlogBtn = document.querySelector("#start-blog");
    const readerLink = document.querySelector("#reader-link");

    // Navigation handlers
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = `${BASE_PATH}/login.html`;
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener("click", () => {
            window.location.href = `${BASE_PATH}/sign-up.html`;
        });
    }

    if (startBlogBtn) {
        startBlogBtn.addEventListener("click", () => {
            window.location.href = `${BASE_PATH}/sign-up.html`;
        });
    }

    if (readerLink) {
        readerLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = `${BASE_PATH}/reader.html`;
        });
    }

    // Handle video loading errors
    const video = document.querySelector('.video-container video');
    if (video) {
        video.addEventListener('error', () => {
            video.style.display = 'none';
            const placeholder = document.querySelector('.video-placeholder');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        });

        video.addEventListener('canplay', () => {
            console.log('Video loaded successfully');
        });

        video.play().catch(error => {
            console.log('Video autoplay failed:', error);
        });
    }

    // Check user session on page load
    async function checkUserSession() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/session`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    updateUIForLoggedInUser(data.user);
                } else {
                    // Check localStorage fallback
                    const stored = localStorage.getItem('user');
                    if (stored) updateUIForLoggedInUser(JSON.parse(stored));
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const stored = localStorage.getItem('user');
            if (stored) updateUIForLoggedInUser(JSON.parse(stored));
        }
    }

    function updateUIForLoggedInUser(user) {
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons && user) {
            authButtons.innerHTML = `
                <a href="${BASE_PATH}/dashboard.html" class="auth-button" style="color: var(--text-color); text-decoration: none;">Dashboard</a>
                <button id="logout" class="auth-button">Logout</button>
            `;

            const logoutBtn = document.getElementById('logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        }
    }

    async function handleLogout() {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            localStorage.removeItem('user');
            window.location.href = `${BASE_PATH}/index.html`;
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    checkUserSession();
});
