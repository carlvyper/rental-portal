// assets/js/notifications.js

document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
    
    // Add event listener for the "Mark All as Read" button
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllNotificationsAsRead);
    }
});

const notificationListUl = document.getElementById('notification-list-ul');
const loadingState = document.getElementById('loading-state');
const markAllReadBtn = document.getElementById('markAllReadBtn');

/**
 * Renders the notification data into the list.
 * @param {Array<Object>} notifications - Array of notification objects from the API.
 */
function renderNotifications(notifications) {
    notificationListUl.innerHTML = ''; // Clear previous content

    if (notifications.length === 0) {
        displayMessage("You currently have no new notifications.", 'info');
        notificationListUl.style.display = 'none';
        markAllReadBtn.style.display = 'none';
        return;
    }

    let unreadCount = 0;

    notifications.forEach(notification => {
        const isRead = notification.is_read;
        if (!isRead) {
            unreadCount++;
        }
        
        // Format the date
        const dateString = new Date(notification.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const listItem = document.createElement('li');
        listItem.className = `notification-item ${isRead ? 'read' : 'unread'}`;
        listItem.dataset.notificationId = notification.id;

        // Note: The click handler will be added later for marking individual items as read
        listItem.innerHTML = `
            <div class="icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="content">
                <div class="header">
                    <span class="title">${notification.title}</span>
                    <span class="date">${dateString}</span>
                </div>
                <p class="message">${notification.message}</p>
            </div>
        `;
        notificationListUl.appendChild(listItem);
    });

    notificationListUl.style.display = 'block';
    markAllReadBtn.style.display = (unreadCount > 0) ? 'block' : 'none';
}


/**
 * Fetches the notification data from the API and initiates rendering.
 */
async function loadNotifications() {
    loadingState.style.display = 'block'; 

    try {
        // GET request to the /notifications/ endpoint
        const data = await apiFetch('/notifications/', 'GET'); 

        if (Array.isArray(data)) {
            renderNotifications(data);
        } else {
            throw new Error('Unexpected data format received.');
        }

    } catch (error) {
        notificationListUl.style.display = 'none';
        markAllReadBtn.style.display = 'none';
        displayMessage(`Failed to load notifications: ${error.message}`, 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

/**
 * Sends a request to the API to mark all notifications for the user as read.
 */
async function markAllNotificationsAsRead() {
    if (!confirm("Are you sure you want to mark all notifications as read?")) {
        return;
    }
    
    // Disable the button and show loading state
    markAllReadBtn.disabled = true;
    const originalText = markAllReadBtn.innerHTML;
    markAllReadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Since this is a modifying action (POST), we need the CSRF token
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Action failed: Security token missing.', 'error');
        markAllReadBtn.disabled = false;
        markAllReadBtn.innerHTML = originalText;
        return;
    }
    const headers = { 'X-CSRFToken': csrfToken };
    
    try {
        // Assuming your backend has a dedicated endpoint for this action
        // Example: /notifications/mark_all_read/
        await apiFetch('/notifications/mark_all_read/', 'POST', {}, headers); 
        
        // Success: Re-render the list to update the visual state
        displayMessage('All notifications marked as read.', 'success');
        loadNotifications(); 
        
    } catch (error) {
        displayMessage(`Failed to mark all as read: ${error.message}`, 'error');
    } finally {
        markAllReadBtn.disabled = false;
        markAllReadBtn.innerHTML = originalText;
    }
}