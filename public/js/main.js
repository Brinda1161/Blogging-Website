document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = 'https://blogging-website-2-pin2.onrender.com';
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
            // Hide video and show placeholder if video fails to load
            video.style.display = 'none';
            const placeholder = document.querySelector('.video-placeholder');
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        });
        
        // Check if video can play
        video.addEventListener('canplay', () => {
            console.log('Video loaded successfully');
        });
        
        // Try to play the video and handle autoplay restrictions
        video.play().catch(error => {
            console.log('Video autoplay failed:', error);
            // Show play button or handle autoplay restriction
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
                    // User is logged in, update UI accordingly
                    updateUIForLoggedInUser(data.user);
                }
            }
        } catch (error) {
            console.log('Session check failed:', error);
        }
    }

    function updateUIForLoggedInUser(user) {
        // Update auth buttons to show dashboard/logout instead of login/signup
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons && user) {
            authButtons.innerHTML = `
                <a href="${BASE_PATH}/dashboard.html" class="auth-button" style="color: var(--text-color); text-decoration: none;">Dashboard</a>
                <button id="logout" class="auth-button">Logout</button>
            `;
            
            // Add logout handler
            const logoutBtn = document.getElementById('logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        }
    }

    async function handleLogout() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                alert('Error logging out');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out');
        }
    }

    // Initialize session check
    checkUserSession();
});