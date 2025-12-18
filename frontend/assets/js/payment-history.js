// assets/js/payment-history.js

document.addEventListener('DOMContentLoaded', () => {
    // We call the function to load the data when the page finishes loading
    loadPaymentHistory();
});

const paymentTableBody = document.getElementById('payment-table-body');
const paymentTable = document.getElementById('payment-table');
const loadingState = document.getElementById('loading-state');

/**
 * Renders the payment data into the table body.
 * @param {Array<Object>} payments - Array of payment objects from the API.
 */
function renderPaymentTable(payments) {
    // 1. Clear any existing content
    paymentTableBody.innerHTML = ''; 

    if (payments.length === 0) {
        // Handle case where no records exist
        displayMessage("You do not have any recorded rent payments yet.", 'warning');
        if (paymentTable) paymentTable.style.display = 'none';
        return;
    }

    payments.forEach(payment => {
        // Format the date for display (e.g., "2023-10-25" -> "Oct 25, 2023")
        const datePaid = new Date(payment.date_paid).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Format the Month Paid For
        const monthPaidFor = new Date(payment.month_paid_for).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long'
        });
        
        // Determine the CSS class for the status tag
        const statusClass = payment.status === 'Paid' ? 'Paid' : 'Pending'; 

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${monthPaidFor}</td>
            <td>Ksh ${payment.amount.toLocaleString('en-US')}</td>
            <td>${datePaid}</td>
            <td><span class="status-tag ${statusClass}">${payment.status}</span></td>
            <td>${payment.transaction_id || 'N/A'}</td>
            <td>
            <button class="btn btn-sm primary-btn" onclick="downloadReceipt(${payment.id})">
                    <i class="fas fa-download"></i> Receipt
                </button>
            </td>
        `;
        paymentTableBody.appendChild(row);
    });

    // Show the table and hide the loading state
    if (paymentTable) paymentTable.style.display = 'table';
    if (loadingState) loadingState.style.display = 'none';
}

/**
 * UPDATED: Uses the global API_BASE_URL for downloads
 */
function downloadReceipt(paymentId) {
    // We point directly to the backend view using the live API base
    const url = `${API_BASE_URL}/download-receipt/${paymentId}/`;
    window.open(url, '_blank');
}

/**
 * Fetches the payment data from the API and initiates rendering.
 */
async function loadPaymentHistory() {
    if (loadingState) loadingState.style.display = 'block'; 

    try {
        const data = await apiFetch('/payments/', 'GET'); 

        if (Array.isArray(data)) {
            renderPaymentTable(data);
        } else {
            throw new Error('Unexpected data format received from the server.');
        }

    } catch (error) {
        if (loadingState) loadingState.style.display = 'none';
        if (paymentTable) paymentTable.style.display = 'none';
        
        let errorMessage = 'Failed to load payment history.';
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
             errorMessage = 'You are not authorized. Please log in again.';
             // Redirect to login if unauthorized
             setTimeout(() => { window.location.href = '/'; }, 2000);
        }
        displayMessage(errorMessage, 'error');

    } finally {
        if (loadingState) loadingState.style.display = 'none';
    }
}