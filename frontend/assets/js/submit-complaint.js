// assets/js/submit-complaint.js - FINAL CSRF FIX IMPLEMENTED VIA COOKIE

document.addEventListener('DOMContentLoaded', () => {
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmission);
    }
});

// Helper function to safely get the CSRF token from the browser cookie
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

// NOTE: Assuming displayMessage is a global utility function that shows the message in the message container.
function displayMessage(text, type) {
    const messageContainer = document.getElementById('message');
    if (messageContainer) {
        messageContainer.textContent = text;
        messageContainer.className = `message-area ${type}`;
        messageContainer.style.display = 'block';
    }
}

async function handleComplaintSubmission(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.textContent;
    
    // UI state: Start loading
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    document.getElementById('message').style.display = 'none';

    // 1. Get the CSRF Token from the cookie
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        // If no token is found in the cookie, it's a security issue or not logged in.
        displayMessage('Submission failed: Security token missing. Please log out and back in.', 'error');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        return;
    }

    // 2. Collect data and prepare payload
    const form = e.target;
    const data = {
        type: form.complaintType.value,
        subject: form.complaintType.options[form.complaintType.selectedIndex].text, 
        description: form.description.value,
    };
    
    // Define the headers, crucially including the CSRF token
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken // Sending the correct token from the cookie
    };

    try {
        // 3. Make the API call
        await apiFetch('/complaints/', 'POST', data, headers); 
        
        // Success
        displayMessage('Complaint submitted successfully! We will review it soon.', 'success');
        form.reset(); 
        
    } catch (error) {
        // Error handling
        let errorMessage = error.message || 'An unknown error occurred.';
        // Custom check to make the CSRF error message more user-friendly
        if (error.message && error.message.includes('403')) {
            // This 403 error should now be fixed, but we keep the friendly message just in case of future config errors
            errorMessage = 'Submission failed due to a security issue (CSRF). Please refresh your browser.';
        }
        displayMessage(`Submission failed: ${errorMessage}`, 'error');
        
    } finally {
        // UI state: Reset
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}