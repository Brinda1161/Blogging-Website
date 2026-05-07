document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');
    const submitButton = form.querySelector('button[type="submit"]');

    console.log('🔧 Login script loaded - DOM fully loaded');
    console.log('📝 Form element:', form);
    console.log('❌ Error div:', errorDiv);

    // Check existing session
    async function checkExistingSession() {
        try {
            console.log('🔍 [SESSION CHECK] Starting session check...');
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            
            console.log('📊 [SESSION CHECK] Response status:', response.status);
            console.log('📊 [SESSION CHECK] Response OK:', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('👤 [SESSION CHECK] Session data:', JSON.stringify(data, null, 2));
                
                if (data.authenticated && data.user) {
                    console.log('✅ [SESSION CHECK] User already logged in, redirecting...');
                    redirectBasedOnRole(data.user.role);
                } else {
                    console.log('ℹ️ [SESSION CHECK] No active session found');
                }
            } else {
                console.log('❌ [SESSION CHECK] Session check failed with status:', response.status);
            }
        } catch (error) {
            console.error('💥 [SESSION CHECK] Session check error:', error);
        }
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🔄 [FORM SUBMIT] Form submission intercepted');
        console.log('🔄 [FORM SUBMIT] Default prevented:', e.defaultPrevented);

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        console.log('📝 [FORM DATA] Username:', username);
        console.log('📝 [FORM DATA] Password length:', password.length);

        if (!username || !password) {
            console.log('❌ [VALIDATION] Missing fields');
            showError('Please fill in all fields');
            return;
        }

        console.log('✅ [VALIDATION] All fields filled');
        setLoadingState(true);

        try {
            console.log('📤 [LOGIN REQUEST] Sending login request to /api/auth/login');
            console.log('📤 [LOGIN REQUEST] Request body:', { username, password: '*'.repeat(password.length) });
            
            const startTime = Date.now();
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            const endTime = Date.now();
            
            console.log('📥 [LOGIN RESPONSE] Response received in', endTime - startTime + 'ms');
            console.log('📥 [LOGIN RESPONSE] Response status:', response.status);
            console.log('📥 [LOGIN RESPONSE] Response OK:', response.ok);
            console.log('📥 [LOGIN RESPONSE] Response headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('📥 [LOGIN RESPONSE] Raw response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('📋 [LOGIN RESPONSE] Parsed JSON data:', JSON.stringify(data, null, 2));
            } catch (parseError) {
                console.error('❌ [LOGIN RESPONSE] JSON parse error:', parseError);
                showError('Invalid response from server');
                return;
            }

            if (response.ok && data.success) {
                console.log('✅ [LOGIN SUCCESS] Login successful!');
                console.log('👤 [LOGIN SUCCESS] User data:', data.user);
                
                // Use the role from the response to redirect
                const userRole = data.user?.role || 'user';
                console.log('🎭 [LOGIN SUCCESS] Determined role:', userRole);
                
                showSuccess('Login successful! Redirecting...');
                
                // Test if redirect URLs are accessible
                console.log('🧪 [REDIRECT TEST] Testing redirect URLs...');
                testRedirectURLs(userRole);
                
                // Redirect after short delay
                console.log('⏰ [REDIRECT] Setting timeout for redirect...');
                setTimeout(() => {
                    console.log('🔄 [REDIRECT] Executing redirect now...');
                    redirectBasedOnRole(userRole);
                }, 1000);
                
            } else {
                const errorMessage = data.error || data.message || 'Login failed';
                console.log('❌ [LOGIN FAILED] Error message:', errorMessage);
                console.log('❌ [LOGIN FAILED] Full error data:', data);
                showError(errorMessage);
            }

        } catch (err) {
            console.error('💥 [NETWORK ERROR] Fetch error:', err);
            console.error('💥 [NETWORK ERROR] Error name:', err.name);
            console.error('💥 [NETWORK ERROR] Error message:', err.message);
            showError('Network error. Please check your connection.');
        } finally {
            console.log('🏁 [FORM SUBMIT] Request completed, resetting loading state');
            setLoadingState(false);
        }
    });

    function testRedirectURLs(role) {
        const testUrls = {
            'admin': '/admin.html',
            'user': '/userPage.html'
        };
        
        const testUrl = testUrls[role] || testUrls['user'];
        console.log('🧪 [URL TEST] Testing access to:', testUrl);
        
        // Test if the URL is accessible
        fetch(testUrl, { method: 'HEAD' })
            .then(testResponse => {
                console.log('🧪 [URL TEST] URL accessibility check:', testResponse.status);
                if (testResponse.status === 404) {
                    console.error('❌ [URL TEST] Redirect URL not found (404):', testUrl);
                    console.log('🧪 [URL TEST] Available pages - checking common URLs...');
                    
                    // Test common URLs
                    const commonUrls = ['/admin.html', '/userPage.html', '/dashboard.html', '/index.html'];
                    commonUrls.forEach(url => {
                        fetch(url, { method: 'HEAD' })
                            .then(res => console.log(`🧪 [URL TEST] ${url}: ${res.status}`))
                            .catch(err => console.log(`🧪 [URL TEST] ${url}: ERROR`));
                    });
                }
            })
            .catch(err => {
                console.error('❌ [URL TEST] URL test failed:', err);
            });
    }

    function redirectBasedOnRole(role) {
        let redirectUrl;
        
        switch(role) {
            case 'admin':
                redirectUrl = '/admin.html';
                break;
            case 'user':
            default:
                redirectUrl = '/userPage.html';
                break;
        }
        
        console.log('🔄 [REDIRECT] Final redirect decision:');
        console.log('🔄 [REDIRECT] - Role:', role);
        console.log('🔄 [REDIRECT] - URL:', redirectUrl);
        console.log('🔄 [REDIRECT] - Full current URL:', window.location.href);
        console.log('🔄 [REDIRECT] - New URL will be:', new URL(redirectUrl, window.location.origin).href);
        
        // Double check if we're already on the target page
        const currentPath = window.location.pathname;
        console.log('🔄 [REDIRECT] Current path:', currentPath);
        
        if (currentPath === redirectUrl) {
            console.log('⚠️ [REDIRECT] Already on target page, reloading instead');
            window.location.reload();
        } else {
            console.log('🚀 [REDIRECT] Performing redirect now...');
            window.location.href = redirectUrl;
        }
    }

    function showError(message) {
        console.log('🚨 [ERROR DISPLAY] Showing error:', message);
        errorDiv.textContent = message;
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            console.log('🧹 [ERROR DISPLAY] Auto-hiding error message');
            errorDiv.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        console.log('✅ [SUCCESS DISPLAY] Showing success:', message);
        errorDiv.textContent = message;
        errorDiv.className = 'success-message';
        errorDiv.style.display = 'block';
    }

    function setLoadingState(isLoading) {
        console.log('⚡ [LOADING STATE] Setting loading:', isLoading);
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Logging in...' : 'Log In';
        console.log('⚡ [LOADING STATE] Button disabled:', submitButton.disabled);
        console.log('⚡ [LOADING STATE] Button text:', submitButton.textContent);
    }

    // Clear error on input
    document.getElementById('username').addEventListener('input', () => {
        console.log('📝 [INPUT] Username field input, clearing error');
        errorDiv.style.display = 'none';
    });
    
    document.getElementById('password').addEventListener('input', () => {
        console.log('📝 [INPUT] Password field input, clearing error');
        errorDiv.style.display = 'none';
    });

    // Add click listener to button for extra debugging
    submitButton.addEventListener('click', (e) => {
        console.log('🖱️ [BUTTON CLICK] Submit button clicked');
        console.log('🖱️ [BUTTON CLICK] Event phase:', e.eventPhase);
    });

    // Check for form validation issues
    form.addEventListener('invalid', (e) => {
        console.log('❌ [FORM VALIDATION] Invalid field:', e.target.id);
    }, true);

    console.log('🔧 [INIT] Starting session check...');
    // Check session on load
    checkExistingSession();
});