# tenant_api/models.py

from django.db import models
from django.contrib.auth.models import User # Use the default Django User model

# Extends the built-in User model with Tenant-specific fields
class TenantProfile(models.Model):
    # One-to-one link to the user
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    unit_number = models.CharField(max_length=10, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

class Payment(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending Verification'),
        ('Paid', 'Paid & Confirmed'),
        ('Failed', 'Payment Failed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    # Stored as YYYY-MM-01 in the database
    month_paid_for = models.DateField() 
    payment_method = models.CharField(max_length=50) 
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment by {self.user.username} for {self.month_paid_for}"

class Complaint(models.Model):
    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('Pending', 'Pending Review'),
        ('Resolved', 'Resolved'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=50) 
    subject = models.CharField(max_length=255) # e.g., 'Plumbing / Leaks'
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint: {self.subject} ({self.status})"

class MaintenanceRequest(models.Model):
    URGENCY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    request_subject = models.CharField(max_length=255)
    description = models.TextField()
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='Medium')
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request: {self.request_subject} (Urgency: {self.urgency})"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    # tenant_api/models.py
# ... (all your existing models)

class MpesaTransaction(models.Model):
    """
    Stores records of all STK Push initiation attempts and callback results.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending confirmation'),
        ('COMPLETED', 'Payment successful'),
        ('FAILED', 'Payment failed or cancelled'),
    )

    tenant = models.ForeignKey(TenantProfile, on_delete=models.CASCADE)
    # The reference we send to Safaricom to track the transaction
    account_reference = models.CharField(max_length=50, unique=True, db_index=True) 
    
    # IDs returned by Safaricom immediately after initiation
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    phone_number = models.CharField(max_length=15)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    mpesa_receipt_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Store the raw data from Safaricom's callback for debugging/completeness
    callback_data = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.account_reference} - {self.status} ({self.tenant.user.username})"

    class Meta:
        ordering = ['-created_at']