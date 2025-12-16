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
        paymentTable.style.display = 'none';
        return;
    }

    payments.forEach(payment => {
        // Format the date for display (e.g., "2023-10-25" -> "Oct 25, 2023")
        const datePaid = new Date(payment.date_paid).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Format the Month Paid For (Assumes month_paid_for is YYYY-MM-DD or YYYY-MM)
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
    paymentTable.style.display = 'table';
    loadingState.style.display = 'none';
}

function downloadReceipt(paymentId) {
    // We point directly to the backend view
    const url = `http://127.0.0.1:8000/api/download-receipt/${paymentId}/`;
    window.open(url, '_blank');
}
/**
 * Fetches the payment data from the API and initiates rendering.
 */
async function loadPaymentHistory() {
    loadingState.style.display = 'block'; // Show spinner

    try {
        // The endpoint is mapped to PaymentListCreateView, which handles GET requests (listing)
        const data = await apiFetch('/payments/', 'GET'); 

        // Check if the response is an array (which it should be for a List view)
        if (Array.isArray(data)) {
            renderPaymentTable(data);
        } else {
            // Handle unexpected response format
            throw new Error('Unexpected data format received from the server.');
        }

    } catch (error) {
        // Handle API errors (e.g., network, 401 Unauthorized)
        loadingState.style.display = 'none';
        paymentTable.style.display = 'none';
        
        let errorMessage = 'Failed to load payment history.';
        if (error.message.includes('401')) {
             errorMessage = 'You are not authorized. Please log in again.';
        }
        displayMessage(errorMessage, 'error');

    } finally {
        // Ensure loading state is hidden when done
        loadingState.style.display = 'none';
    }
}