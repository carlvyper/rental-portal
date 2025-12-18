// assets/js/submit-complaint.js

document.addEventListener('DOMContentLoaded', () => {
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmission);
    }
});

async function handleComplaintSubmission(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const messageArea = document.getElementById('message');
    const originalText = submitButton ? submitButton.textContent : 'Submit Complaint';
    
    // UI state: Start loading
    if (submitButton) {
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
    }
    if (messageArea) messageArea.style.display = 'none';

    // 1. Get the CSRF Token (using the global function from utils.js)
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Submission failed: Security token missing. Please log in again.', 'error');
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
        return;
    }

    // 2. Collect data from form
    const form = e.target;
    const data = {
        type: form.complaintType.value,
        subject: form.complaintType.options[form.complaintType.selectedIndex].text, 
        description: form.description.value,
    };
    
    const headers = { 'X-CSRFToken': csrfToken };

    try {
        // 3. Make the API call
        await apiFetch('/complaints/', 'POST', data, headers); 
        
        displayMessage('Complaint submitted successfully! We will review it soon.', 'success');
        form.reset(); 
        
    } catch (error) {
        console.error('Complaint submission error:', error.message);
        
        let errorMessage = error.message;

        // REDIRECT UPDATED: Handle session expiration or CSRF failure
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            displayMessage('Session expired. Redirecting to login...', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return;
        }

        if (errorMessage.includes('403')) {
            errorMessage = 'Security session expired. Please refresh the page.';
        }

        displayMessage(`Submission failed: ${errorMessage}`, 'error');
        
    } finally {
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
}