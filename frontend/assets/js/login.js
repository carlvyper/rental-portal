// assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Check if user is already logged in
    apiFetch('/dashboard-counts/', 'GET')
        .then(() => {
            // REDIRECT UPDATED: Changed from dashboard.html to /dashboard/
            window.location.href = '/dashboard/';
        })
        .catch(() => {
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
        });
});

async function handleLogin(e) {
    e.preventDefault();
    
    const emailValue = document.getElementById('email').value.trim();
    const passwordValue = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');
    
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;

    try {
        // We pass the email input as 'username' to match your views.py .get('username')
        const data = await apiFetch('/login/', 'POST', {
            username: emailValue, 
            password: passwordValue,
        });

        if (data.success) {
            // REDIRECT UPDATED: Changed from dashboard.html to /dashboard/
            window.location.href = '/dashboard/';
        } else {
            throw new Error(data.error || 'Login failed');
        }

    } catch (error) {
        // Display message using your existing displayMessage function
        displayMessage(error.message || 'Invalid credentials', 'error', 'message');
        loginButton.textContent = 'Log In';
        loginButton.disabled = false;
    }
}