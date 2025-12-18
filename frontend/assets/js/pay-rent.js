// assets/js/pay-rent.js

document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('rent-payment-form');
    const paymentMessage = document.getElementById('payment-message');
    const stkStatusMessage = document.getElementById('stk-status-message');
    const phoneInput = document.getElementById('phone');
    const amountInput = document.getElementById('amount');
    
    if (!paymentForm) return;

    const payButton = paymentForm.querySelector('.primary-btn');

    // Polling function to check if the payment is finished
    const checkPaymentStatus = (checkoutId) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            
            // UPDATED: Using apiFetch for consistency and correct base URL
            apiFetch(`/check-status/?checkout_id=${checkoutId}`, 'GET')
                .then(data => {
                    if (data.status === 'COMPLETED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:green;">✅ Payment Successful! Receipt: ${data.receipt}</b>`;
                        
                        // Optional: Redirect to history after success
                        setTimeout(() => {
                            window.location.href = '/payment-history/';
                        }, 3000);

                    } else if (data.status === 'FAILED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:red;">❌ Payment Failed or Cancelled.</b>`;
                        payButton.disabled = false;
                    }
                    
                    if (attempts >= 20) {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:orange;">⚠️ Request timed out. Check history later.</b>`;
                        payButton.disabled = false;
                    }
                })
                .catch(err => {
                    console.error("Status check error:", err);
                });
        }, 3000);
    };

    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // CLEAN PHONE NUMBER
        let phone = phoneInput.value.trim().replace(/\s+/g, '');
        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1);
        } else if (phone.startsWith('7') || phone.startsWith('1')) {
            phone = '254' + phone;
        }

        // UI Feedback
        paymentMessage.style.display = 'none';
        stkStatusMessage.style.display = 'block';
        stkStatusMessage.innerHTML = "Initiating M-Pesa STK Push...";
        payButton.disabled = true;

        // UPDATED: Using apiFetch and CSRF token for secure POST request
        apiFetch('/initiate-stk-push/', 'POST', {
            amount: amountInput.value,
            phone_number: phone
        }, { 'X-CSRFToken': getCsrfToken() })
        .then(data => {
            if (data.ResponseCode == "0") {
                stkStatusMessage.innerHTML = "<b>Prompt sent! Enter M-Pesa PIN on your phone.</b>";
                checkPaymentStatus(data.CheckoutRequestID);
            } else {
                throw new Error(data.error || "M-Pesa request failed");
            }
        })
        .catch(err => {
            stkStatusMessage.style.display = 'none';
            paymentMessage.style.display = 'block';
            paymentMessage.className = 'message-area error';
            
            let cleanMsg = err.message.includes('None') 
                ? "Safaricom rejected the request. Verify your phone number." 
                : err.message;
                
            paymentMessage.textContent = `Error: ${cleanMsg}`;
            payButton.disabled = false;
        });
    });
});