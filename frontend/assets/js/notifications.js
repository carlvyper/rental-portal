// assets/js/notifications.js

document.addEventListener('DOMContentLoaded', () => {
    // Only attempt to load if the notification list exists on the page
    if (document.getElementById('notification-list-ul')) {
        loadNotifications();
    }
    
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
 */
function renderNotifications(notifications) {
    if (!notificationListUl) return;

    notificationListUl.innerHTML = ''; // Clear previous content

    if (notifications.length === 0) {
        displayMessage("You currently have no new notifications.", 'info');
        notificationListUl.style.display = 'none';
        if (markAllReadBtn) markAllReadBtn.style.display = 'none';
        return;
    }

    let unreadCount = 0;

    notifications.forEach(notification => {
        const isRead = notification.is_read;
        if (!isRead) {
            unreadCount++;
        }
        
        const dateString = new Date(notification.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const listItem = document.createElement('li');
        listItem.className = `notification-item ${isRead ? 'read' : 'unread'}`;
        listItem.dataset.notificationId = notification.id;

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
    if (markAllReadBtn) {
        markAllReadBtn.style.display = (unreadCount > 0) ? 'block' : 'none';
    }
}

/**
 * Fetches the notification data from the API and initiates rendering.
 */
async function loadNotifications() {
    if (loadingState) loadingState.style.display = 'block'; 

    try {
        const data = await apiFetch('/notifications/', 'GET'); 

        if (Array.isArray(data)) {
            renderNotifications(data);
        } else {
            throw new Error('Unexpected data format received.');
        }

    } catch (error) {
        if (notificationListUl) notificationListUl.style.display = 'none';
        if (markAllReadBtn) markAllReadBtn.style.display = 'none';
        
        let errorMessage = `Failed to load notifications: ${error.message}`;
        
        // REDIRECT UPDATED: Handle session expiration
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'Session expired. Redirecting to login...';
            setTimeout(() => { window.location.href = '/'; }, 2000);
        }
        
        displayMessage(errorMessage, 'error');
    } finally {
        if (loadingState) loadingState.style.display = 'none';
    }
}

/**
 * Sends a request to the API to mark all notifications as read.
 */
async function markAllNotificationsAsRead() {
    if (!confirm("Are you sure you want to mark all notifications as read?")) {
        return;
    }
    
    if (!markAllReadBtn) return;

    markAllReadBtn.disabled = true;
    const originalText = markAllReadBtn.innerHTML;
    markAllReadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Action failed: Security token missing.', 'error');
        markAllReadBtn.disabled = false;
        markAllReadBtn.innerHTML = originalText;
        return;
    }
    
    const headers = { 'X-CSRFToken': csrfToken };
    
    try {
        await apiFetch('/notifications/mark_all_read/', 'POST', {}, headers); 
        displayMessage('All notifications marked as read.', 'success');
        loadNotifications(); 
        
    } catch (error) {
        displayMessage(`Failed to mark all as read: ${error.message}`, 'error');
    } finally {
        markAllReadBtn.disabled = false;
        markAllReadBtn.innerHTML = originalText;
    }
}