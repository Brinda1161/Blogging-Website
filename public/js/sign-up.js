document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://blogging-website-1-dzzg.onrender.com';
    const form = document.getElementById('signup-form');
    const submitButton = document.getElementById('submit-button');
    const formMessage = document.getElementById('form-message');

    // Check if user is already logged in
    async function checkExistingSession() {
        try {
            const response = await fetch(`${API_BASE}/api/auth/session`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    window.location.href = data.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
                }
            }
        } catch (error) {
            console.log('Session check failed:', error);
        }
    }

    // Password strength indicator
    document.getElementById('password').addEventListener('input', function() {
        const password = this.value;
        const strengthElement = document.getElementById('password-strength');
        
        if (password.length === 0) {
            strengthElement.textContent = '';
            strengthElement.className = 'password-strength';
            return;
        }
        
        let strength = 0;
        let feedback = '';
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        if (strength < 3) {
            feedback = 'Weak password';
            strengthElement.className = 'password-strength strength-weak';
        } else if (strength < 5) {
            feedback = 'Medium strength password';
            strengthElement.className = 'password-strength strength-medium';
        } else {
            feedback = 'Strong password';
            strengthElement.className = 'password-strength strength-strong';
        }
        
        strengthElement.textContent = feedback;
    });

    // Form validation
    function validateForm(username, password, email = '') {
        let isValid = true;
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        formMessage.style.display = 'none';
        
        // Username validation
        if (username.length < 3) {
            showFieldError('username-error', 'Username must be at least 3 characters');
            isValid = false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showFieldError('username-error', 'Username can only contain letters, numbers, and underscores');
            isValid = false;
        }
        
        // Email validation (optional)
        if (email && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFieldError('email-error', 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        // Password validation
        if (password.length < 6) {
            showFieldError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        return isValid;
    }

    function showFieldError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }

    function showFormMessage(message, isSuccess = false) {
        formMessage.textContent = message;
        formMessage.className = isSuccess ? 'success-message' : 'error-message';
        formMessage.style.display = 'block';
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
            form.classList.add('loading');
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
            form.classList.remove('loading');
        }
    }

    // Clear errors when user starts typing
    document.getElementById('username').addEventListener('input', clearErrors);
    document.getElementById('email').addEventListener('input', clearErrors);
    document.getElementById('password').addEventListener('input', clearErrors);

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
        formMessage.style.display = 'none';
    }

    // Sign-up handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!validateForm(username, password, email)) {
            return;
        }

        setLoadingState(true);

        try {
            const userData = {
                username: username,
                password: password
            };

            // Add email only if provided
            if (email) {
                userData.email = email;
            }

            const response = await fetch(`${API_BASE}/api/auth/sign-up`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showFormMessage('Account created successfully! Redirecting to login...', true);
                
                // Redirect to login page after success
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                
            } else {
                showFormMessage(data.error || 'Failed to create account. Please try again.');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            showFormMessage('Network error: Cannot connect to server. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Check for existing session on page load
    checkExistingSession();
});