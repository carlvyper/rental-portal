document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('rent-payment-form');
    const paymentMessage = document.getElementById('payment-message');
    const stkStatusMessage = document.getElementById('stk-status-message');
    const phoneInput = document.getElementById('phone');
    const amountInput = document.getElementById('amount');
    
    if (!paymentForm) return;

    const payButton = paymentForm.querySelector('.primary-btn');

    // Function to check payment status in the backend
    const checkPaymentStatus = (checkoutId) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            
            // Matches: path('api/check-status/<str:checkout_id>/', views.check_payment_status)
            apiFetch(`/api/check-status/${checkoutId}/`, 'GET')
                .then(data => {
                    if (data.status === 'COMPLETED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:green;">✅ Payment Successful! Receipt: ${data.receipt || 'N/A'}</b>`;
                        
                        setTimeout(() => {
                            window.location.href = '/payment-history/';
                        }, 3000);

                    } else if (data.status === 'FAILED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:red;">❌ Payment Failed: ${data.message || 'Cancelled'}</b>`;
                        payButton.disabled = false;
                    }
                    
                    if (attempts >= 20) {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:orange;">⚠️ Request timed out. Check your M-Pesa messages.</b>`;
                        payButton.disabled = false;
                    }
                })
                .catch(err => {
                    console.error("Status check error:", err);
                });
        }, 3000); // Poll every 3 seconds
    };

    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault(); // CRITICAL: Stops the page from refreshing with ?amount=...

        // Standardize phone number format
        let phone = phoneInput.value.trim().replace(/\s+/g, '');
        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1);
        } else if (phone.startsWith('7') || phone.startsWith('1')) {
            phone = '254' + phone;
        }

        // Reset UI
        paymentMessage.style.display = 'none';
        stkStatusMessage.style.display = 'block';
        stkStatusMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initiating M-Pesa STK Push...';
        payButton.disabled = true;

        // Call the STK Push API
        apiFetch('/api/initiate-stk-push/', 'POST', {
            amount: amountInput.value,
            phone_number: phone
        }, { 'X-CSRFToken': getCsrfToken() })
        .then(data => {
            // Daraja returns ResponseCode "0" if the STK push was successfully triggered
            if (data.ResponseCode === "0") {
                stkStatusMessage.innerHTML = "<b>Prompt sent! Enter M-Pesa PIN on your phone.</b>";
                checkPaymentStatus(data.CheckoutRequestID);
            } else {
                throw new Error(data.CustomerMessage || "M-Pesa request failed");
            }
        })
        .catch(err => {
            stkStatusMessage.style.display = 'none';
            paymentMessage.style.display = 'block';
            paymentMessage.className = 'message-area error';
            
            // Handle specific Safaricom errors or general ones
            let cleanMsg = err.message.includes('None') 
                ? "Safaricom rejected the request. Please check if your Daraja app is Active." 
                : err.message;
                
            paymentMessage.textContent = `Error: ${cleanMsg}`;
            payButton.disabled = false;
        });
    });
});