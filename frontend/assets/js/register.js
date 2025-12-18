// assets/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
});

async function handleRegistration(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username').value;
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;
    const registerButton = document.getElementById('registerButton');
    
    registerButton.textContent = 'Registering...';
    registerButton.disabled = true;

    try {
        await apiFetch('/register/', 'POST', {
            username: usernameInput,
            email: emailInput,
            password: passwordInput,
        });

        // Successful registration and automatic login (as per views.py)
        displayMessage('Registration successful! Redirecting to dashboard...', 'success', 'message-container');
        setTimeout(() => {
            // REDIRECT UPDATED: Changed from dashboard.html to /dashboard/
            window.location.href = '/dashboard/';
        }, 1500);

    } catch (error) {
        // Display detailed error from serializer if available
        const errorDetails = error.message.includes('details') 
            ? 'Registration failed. Username/Email may be taken.' 
            : error.message;
            
        displayMessage(errorDetails, 'error', 'message-container');
        registerButton.textContent = 'Register';
        registerButton.disabled = false;
    }
}