document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('rent-payment-form');
    const paymentMessage = document.getElementById('payment-message');
    const stkStatusMessage = document.getElementById('stk-status-message');
    const phoneInput = document.getElementById('phone');
    const amountInput = document.getElementById('amount');
    const payButton = paymentForm.querySelector('.primary-btn');

    // Polling function to check if the payment is finished
    const checkPaymentStatus = (checkoutId) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            fetch(`http://127.0.0.1:8000/api/check-status/?checkout_id=${checkoutId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'COMPLETED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:green;">✅ Payment Successful! Receipt: ${data.receipt}</b>`;
                    } else if (data.status === 'FAILED') {
                        clearInterval(interval);
                        stkStatusMessage.innerHTML = `<b style="color:red;">❌ Payment Failed or Cancelled.</b>`;
                    }
                    if (attempts >= 20) clearInterval(interval);
                });
        }, 3000);
    };

    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // CLEAN PHONE NUMBER
        let phone = phoneInput.value.trim().replace(/\s+/g, '');
        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1);
        } else if (phone.startsWith('7')) {
            phone = '254' + phone;
        }

        // UI Feedback
        paymentMessage.style.display = 'none';
        stkStatusMessage.style.display = 'block';
        stkStatusMessage.innerHTML = "Initiating STK Push...";
        payButton.disabled = true;

        fetch('http://127.0.0.1:8000/api/initiate-stk-push/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amountInput.value,
                phone_number: phone
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ResponseCode == "0") {
                stkStatusMessage.innerHTML = "<b>Prompt sent! Enter PIN on your phone.</b>";
                checkPaymentStatus(data.CheckoutRequestID);
            } else {
                throw new Error(data.error || "Request failed");
            }
        })
        .catch(err => {
            stkStatusMessage.style.display = 'none';
            paymentMessage.style.display = 'block';
            paymentMessage.className = 'message-area error';
            
            // Fix for the "None" error display
            let cleanMsg = err.message.includes('None') ? "Safaricom rejected the request. Check your test number." : err.message;
            paymentMessage.textContent = `Error: ${cleanMsg}`;
            payButton.disabled = false;
        });
    });
});