// assets/js/utils.js

// API Base URL (Assumes Django runs on 127.0.0.1:8000)
const API_BASE_URL = 'http://127.0.0.1:8000/api'; 

/**
 * Helper function to display messages to the user.
 * @param {string} message - The message text.
 * @param {string} type - 'success' or 'error'.
 * @param {string} containerId - The ID of the message container div.
 */
function displayMessage(message, type, containerId = 'message') {
    const container = document.getElementById(containerId);
    if (container) {
        // Clear any existing timeout to prevent conflicts if messages are rapid
        if (container.timeoutId) {
            clearTimeout(container.timeoutId);
        }

        container.textContent = message;
        container.className = `message-area ${type}`;
        container.style.display = 'block';
        
        // Auto-hide success messages after 8 seconds (8000 milliseconds)
        if (type === 'success') {
            container.timeoutId = setTimeout(() => {
                container.style.display = 'none';
                container.textContent = '';
                container.className = 'message-area';
            }, 15000); // 15 seconds
        }
    }
}

/**
 * Helper function to safely get the CSRF token from the browser cookie.
 * !!! NEW ADDITION !!!
 */
function getCsrfToken() {
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
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
 * @param {string} endpoint - The API endpoint (e.g., '/login/').
 * @param {string} method - HTTP method (GET, POST, PATCH).
 * @param {Object} data - Body data for POST/PATCH requests.
 * @param {Object} [customHeaders={}] - Optional custom headers to merge (e.g., CSRF)
 * @returns {Promise<Object>} - The JSON response data.
 */
async function apiFetch(endpoint, method = 'GET', data = null, customHeaders = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const options = {
        method: method,
        // FIX: Merge default headers with custom headers (including X-CSRFToken)
        headers: {
            ...defaultHeaders,
            ...customHeaders
        },
        // CRITICAL: Credentials are needed for Django Session Authentication
        credentials: 'include', 
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        // Special case: Django Logout returns 204 No Content (No JSON body expected)
        if (response.status === 204) {
            return { success: true }; 
        }
        
        // For other responses, try to read JSON
        const responseData = await response.json();
        
        if (!response.ok) {
            // Handle HTTP errors (4xx, 5xx)
            const error = responseData.error || responseData.detail || `Server returned status ${response.status}.`;
            throw new Error(error);
        }
        
        return responseData;
        
    } catch (error) {
        // Handle network errors or thrown JSON errors
        console.error("API Fetch Error:", error);
        throw new Error(error.message || 'Network request failed.');
    }
}

/**
 * Handles user logout across the entire application.
 */
function handleLogout() {
    // Confirm before logging out
    if (!confirm("Are you sure you want to log out?")) {
        return;
    }
    
    // NOTE: This call automatically works because the POST to /logout/ relies on the credentials: 'include' option.
    apiFetch('/logout/', 'POST')
        .then(() => {
            console.log('User logged out successfully. Redirecting...');
            window.location.href = 'login.html'; // Redirect to login page
        })
        .catch(error => {
            console.error('Logout error:', error);
            displayMessage('Logout failed. Server or network issue.', 'error', 'message');
        });
}

// Check if user is authenticated on page load (excluding login/register)
function checkAuth() {
    const authPages = ['login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!authPages.includes(currentPage)) {
        // Call a lightweight, protected endpoint to verify session
        apiFetch('/profile/') 
            .catch(() => {
                // If fetching profile fails (e.g., 401 Unauthorized), redirect to login
                console.log('Authentication failed, redirecting to login.');
                window.location.href = 'login.html';
            });
    }
}

// Run auth check immediately
window.onload = checkAuth;

// Global logout button listener (for pages without the sidebar structure)
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});