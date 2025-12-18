// assets/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // Only run if the profile element exists
    if (document.getElementById('username')) {
        loadProfileData();
    }
    
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleChangePassword); 
    }
});

async function loadProfileData() {
    const loading = document.getElementById('loadingMessage');
    const profileCard = document.getElementById('profileCard');

    try {
        const data = await apiFetch('/profile/', 'GET');
        
        // Populate fields
        if (document.getElementById('username')) document.getElementById('username').value = data.username || '';
        if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
        if (document.getElementById('firstName')) document.getElementById('firstName').value = data.first_name || '';
        if (document.getElementById('lastName')) document.getElementById('lastName').value = data.last_name || '';
        
        if (loading) loading.style.display = 'none';
        if (profileCard) profileCard.style.display = 'block';

    } catch (error) {
        console.error('Profile load error:', error.message);
        
        // REDIRECT UPDATED: Handle session expiration
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            displayMessage('Session expired. Redirecting...', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
        } else {
            displayMessage(`Failed to load profile: ${error.message}`, 'error');
        }
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const updateProfileButton = document.getElementById('updateProfileButton');
    const originalText = updateProfileButton ? updateProfileButton.textContent : 'Update Profile';
    
    if (updateProfileButton) {
        updateProfileButton.textContent = 'Updating...';
        updateProfileButton.disabled = true;
    }
    
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Update failed: Security token missing.', 'error');
        if (updateProfileButton) {
            updateProfileButton.textContent = originalText;
            updateProfileButton.disabled = false;
        }
        return;
    }
    const headers = { 'X-CSRFToken': csrfToken };
    
    const data = {
        email: document.getElementById('email').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
    };

    try {
        await apiFetch('/profile/', 'PATCH', data, headers);
        displayMessage('Profile updated successfully!', 'success');
    } catch (error) {
        displayMessage(`Update failed: ${error.message}`, 'error');
    } finally {
        if (updateProfileButton) {
            updateProfileButton.textContent = originalText;
            updateProfileButton.disabled = false;
        }
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const changePasswordButton = document.getElementById('changePasswordButton');
    
    if (changePasswordButton) {
        changePasswordButton.textContent = 'Changing...';
        changePasswordButton.disabled = true;
    }

    const displayPasswordMessage = (msg, type) => displayMessage(msg, type, 'passwordMessage');
    
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayPasswordMessage('Password change failed: Security token missing.', 'error');
        if (changePasswordButton) {
            changePasswordButton.textContent = 'Change Password';
            changePasswordButton.disabled = false;
        }
        return;
    }
    const headers = { 'X-CSRFToken': csrfToken };
    
    try {
        await apiFetch('/change-password/', 'POST', {
            current_password: currentPasswordInput.value,
            new_password: newPasswordInput.value,
        }, headers); 
        
        displayPasswordMessage('Password changed successfully!', 'success');
        
        // Clear fields
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        
    } catch (error) {
        displayPasswordMessage(`Failed: ${error.message}`, 'error');
    } finally {
        if (changePasswordButton) {
            changePasswordButton.textContent = 'Change Password';
            changePasswordButton.disabled = false;
        }
    }
}