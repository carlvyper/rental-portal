// assets/js/dashboard.js

// NOTE: This file is used on most pages to ensure global functions (like handleLogout) are loaded.
// It also contains logic specific to the dashboard page itself.

document.addEventListener('DOMContentLoaded', () => {
    // UPDATED: Check for the element existence instead of the .html filename
    if (document.getElementById('tenantUsername')) {
        loadDashboardData();
    }
});

async function loadDashboardData() {
    try {
        const data = await apiFetch('/dashboard-counts/', 'GET');
        
        // Update Welcome Message
        const usernameElement = document.getElementById('tenantUsername');
        if (usernameElement && data.username) {
            usernameElement.textContent = data.username.toUpperCase();
        }
        
        // Update Stats
        const notifElement = document.getElementById('notificationCount');
        const complaintElement = document.getElementById('open-complaints-count');
        
        if (notifElement) notifElement.textContent = data.unread_notifications;
        if (complaintElement) complaintElement.textContent = data.open_complaints;
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error.message);
        
        // REDIRECT UPDATED: Changed from login.html to root path /
        if (error.message.includes('401') || error.message.includes('Unauthorized')) { 
            window.location.href = '/'; 
        }
    }
}
