from django.contrib import admin
from .models import TenantProfile, Payment, Complaint, MaintenanceRequest, Notification, MpesaTransaction

@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'unit_number', 'phone_number')
    search_fields = ('user__username', 'phone_number', 'unit_number')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'month_paid_for', 'status', 'timestamp')
    list_filter = ('status', 'month_paid_for')

@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = ('account_reference', 'tenant', 'amount', 'status', 'mpesa_receipt_number', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('callback_data',) # Keeps raw JSON safe from accidental edits

# Quick registration for the other models
admin.site.register(Complaint)
admin.site.register(MaintenanceRequest)
admin.site.register(Notification)