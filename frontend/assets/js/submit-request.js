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
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    
    // --- CSRF FIX: Retrieve and prepare headers ---
    // 1. Get the token using the function defined in utils.js
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        // If the token is missing, display error and stop submission
        displayMessage('Submission failed: Security token missing. Please refresh the page.', 'error');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        return;
    }
    // 2. Define the headers object needed for Django authentication
    const headers = { 'X-CSRFToken': csrfToken };
    // --- CSRF FIX END ---
    
    // Collect data
    const form = e.target;
    const data = {
        // Ensure keys match your Django serializer fields exactly
        request_subject: form.subject.value, 
        urgency: form.urgency.value,
        description: form.description.value,
    };

    try {
        // CRITICAL: Pass the headers as the FOURTH argument to include the CSRF token
        await apiFetch('/requests/', 'POST', data, headers); 
        
        // --- SUCCESS MESSAGE LOGIC ---
        displayMessage('Maintenance request submitted successfully! We will contact you soon.', 'success');
        form.reset(); // Clear the form on success
        
    } catch (error) {
        // Display any API error messages
        displayMessage(`Submission failed: ${error.message}`, 'error');
    } finally {
        // Reset the button state whether successful or failed
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}