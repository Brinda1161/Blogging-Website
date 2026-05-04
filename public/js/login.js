const API_BASE = 'https://blogging-website-2-pin2.onrender.com';
const form = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showError("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // ✅ Required for sessions
        });
        
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            showError("Server returned an invalid response.");
            return;
        }
        
        if (response.ok) {
            console.log("Login successful:", data);
            // Store user info in localStorage as fallback for session
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = data.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
        } else {
            const errorMessage = data.message || 
                                data.error || 
                                "Invalid username or password.";
            showError(errorMessage);
        }
    } catch (err) {
        console.error("Network error:", err);
        showError("Unable to connect to server.");
    }
});

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}