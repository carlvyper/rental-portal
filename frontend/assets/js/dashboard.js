// assets/js/dashboard.js

// NOTE: This file is used on most pages to ensure global functions (like handleLogout) are loaded.
// It also contains logic specific to the dashboard page itself.

document.addEventListener('DOMContentLoaded', () => {
    // Only run dashboard specific logic if on dashboard.html
    if (document.getElementById('tenantUsername')) {
        loadDashboardData();
    }
});

async function loadDashboardData() {
    try {
        const data = await apiFetch('/dashboard-counts/', 'GET');
        
        // Update Welcome Message
        document.getElementById('tenantUsername').textContent = data.username.toUpperCase();
        
        // Update Stats
        document.getElementById('notificationCount').textContent = data.unread_notifications;
        document.getElementById('open-complaints-count').textContent = data.open_complaints;
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error.message);
        // Optionally redirect to login if 401
        if (error.message.includes('401')) { 
            window.location.href = 'login.html'; 
        }
    }
}