from django.contrib import admin
from .models import Tenant, Payment  # Check if your model names are exactly these

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'house_number', 'balance')
    search_fields = ('full_name', 'phone_number')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'amount', 'checkout_request_id', 'status', 'created_at')
    list_filter = ('status', 'created_at')
