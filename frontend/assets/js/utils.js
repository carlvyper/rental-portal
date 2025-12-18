// assets/js/utils.js

// API Base URL - UPDATED to your live Render URL
const API_BASE_URL = 'https://rental-portal-5ma1.onrender.com/api'; 

/**
 * Helper function to display messages to the user.
 */
function displayMessage(message, type, containerId = 'message') {
    const container = document.getElementById(containerId);
    if (container) {
        if (container.timeoutId) {
            clearTimeout(container.timeoutId);
        }

        container.textContent = message;
        container.className = `message-area ${type}`;
        container.style.display = 'block';
        
        if (type === 'success') {
            container.timeoutId = setTimeout(() => {
                container.style.display = 'none';
                container.textContent = '';
                container.className = 'message-area';
            }, 15000); 
        }
    }
}

/**
 * Helper function to safely get the CSRF token from the browser cookie.
 */
function getCsrfToken() {
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                let cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                if (cookieValue) {
                    return cookieValue;
                }
            }
        }
    }
    return '';
}

/**
 * Handles all API fetch requests.
 */
async function apiFetch(endpoint, method = 'GET', data = null, customHeaders = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const options = {
        method: method,
        headers: {
            ...defaultHeaders,
            ...customHeaders
        },
        credentials: 'include', 
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        if (response.status === 204) {
            return { success: true }; 
        }
        
        const responseData = await response.json();
        
        if (!response.ok) {
            const error = responseData.error || responseData.detail || `Server returned status ${response.status}.`;
            throw new Error(error);
        }
        
        return responseData;
        
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw new Error(error.message || 'Network request failed.');
    }
}

/**
 * Handles user logout across the entire application.
 */
function handleLogout() {
    if (!confirm("Are you sure you want to log out?")) {
        return;
    }
    
    apiFetch('/logout/', 'POST')
        .then(() => {
            console.log('User logged out successfully. Redirecting...');
            window.location.href = '/'; // REDIRECT UPDATED: Changed from login.html to /
        })
        .catch(error => {
            console.error('Logout error:', error);
            displayMessage('Logout failed. Server or network issue.', 'error', 'message');
        });
}

/**
 * Check if user is authenticated on page load.
 */
function checkAuth() {
    // UPDATED: Logic to detect auth pages based on clean paths
    const path = window.location.pathname;
    const isAuthPage = path === '/' || path === '/register/' || path.includes('register');

    if (!isAuthPage) {
        apiFetch('/profile/') 
            .catch(() => {
                console.log('Authentication failed, redirecting to login.');
                window.location.href = '/'; // REDIRECT UPDATED: Changed from login.html to /
            });
    }
}

window.onload = checkAuth;

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});