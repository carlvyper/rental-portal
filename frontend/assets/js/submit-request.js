// assets/js/submit-request.js

document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', handleRequestSubmission);
    }
});

async function handleRequestSubmission(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton ? submitButton.textContent : 'Submit Request';
    
    // UI state: Start loading
    if (submitButton) {
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
    }
    
    // 1. Get the token using the global function from utils.js
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        displayMessage('Submission failed: Security token missing. Please log in again.', 'error');
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
        return;
    }

    const headers = { 'X-CSRFToken': csrfToken };
    
    // 2. Collect data
    const form = e.target;
    const data = {
        request_subject: form.subject.value, 
        urgency: form.urgency.value,
        description: form.description.value,
    };

    try {
        // 3. Make the API call
        await apiFetch('/requests/', 'POST', data, headers); 
        
        displayMessage('Maintenance request submitted successfully! We will contact you soon.', 'success');
        form.reset(); 
        
    } catch (error) {
        console.error('Request submission error:', error.message);
        
        let errorMessage = error.message;

        // REDIRECT UPDATED: Handle session expiration
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            displayMessage('Session expired. Redirecting to login...', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return;
        }

        displayMessage(`Submission failed: ${errorMessage}`, 'error');
    } finally {
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
}