// assets/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    if (passwordForm) {
        // Renamed function in your previous code to match this name
        passwordForm.addEventListener('submit', handleChangePassword); 
    }
});

async function loadProfileData() {
    try {
        const loading = document.getElementById('loadingMessage');
        const profileCard = document.getElementById('profileCard');
        
        const data = await apiFetch('/profile/', 'GET');
        
        // Populate fields
        document.getElementById('username').value = data.username || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('lastName').value = data.last_name || '';
        
        loading.style.display = 'none';
        profileCard.style.display = 'block';

    } catch (error) {
        displayMessage(`Failed to load profile: ${error.message}`, 'error');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const updateProfileButton = document.getElementById('updateProfileButton');
    const originalText = updateProfileButton.textContent;
    updateProfileButton.textContent = 'Updating...';
    updateProfileButton.disabled = true;
    
    // --- CSRF FIX START ---
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Update failed: Security token missing.', 'error');
        updateProfileButton.textContent = originalText;
        updateProfileButton.disabled = false;
        return;
    }
    const headers = { 'X-CSRFToken': csrfToken };
    // --- CSRF FIX END ---
    
    const data = {
        email: document.getElementById('email').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
    };

    try {
        // Pass the headers with the CSRF token
        await apiFetch('/profile/', 'PATCH', data, headers);
        displayMessage('Profile updated successfully!', 'success');
    } catch (error) {
        displayMessage(`Update failed: ${error.message}`, 'error');
    } finally {
        updateProfileButton.textContent = originalText;
        updateProfileButton.disabled = false;
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const changePasswordButton = document.getElementById('changePasswordButton');
    
    changePasswordButton.textContent = 'Changing...';
    changePasswordButton.disabled = true;

    // Use the dedicated message area for password updates
    const displayPasswordMessage = (msg, type) => displayMessage(msg, type, 'passwordMessage');
    
    // --- CSRF FIX START ---
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayPasswordMessage('Password change failed: Security token missing.', 'error');
        changePasswordButton.textContent = 'Change Password';
        changePasswordButton.disabled = false;
        return;
    }
    const headers = { 'X-CSRFToken': csrfToken };
    // --- CSRF FIX END ---
    
    try {
        // Pass the headers with the CSRF token
        await apiFetch('/change-password/', 'POST', {
            current_password: currentPassword,
            new_password: newPassword,
        }, headers); 
        
        displayPasswordMessage('Password changed successfully!', 'success', 'passwordMessage');
        // Clear fields on success
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
    } catch (error) {
        displayPasswordMessage(`Failed: ${error.message}`, 'error', 'passwordMessage');
    } finally {
        changePasswordButton.textContent = 'Change Password';
        changePasswordButton.disabled = false;
    }
}