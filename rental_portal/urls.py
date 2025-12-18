# rental_portal/urls.py
from django.contrib import admin
from django.urls import path, include
from tenant_api import views 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This prefix handles all paths in tenant_api/urls.py (e.g., /api/login/)
    path('api/', include('tenant_api.urls')),
    
    # --- FRONTEND HTML PAGE ROUTES (No prefix) ---
    path('', views.home_page, name='home'),
    path('register/', views.register_page, name='register_page'),
    path('dashboard/', views.dashboard_page, name='dashboard'),
    path('profile/', views.profile_page, name='profile_page'),
    path('pay-rent/', views.pay_rent_page, name='pay_rent'),
    path('payment-history/', views.payment_history_page, name='payment_history'),
    path('notifications/', views.notifications_page, name='notifications_page'),
    path('submit-complaint/', views.submit_complaint_page, name='submit_complaint'),
    path('submit-request/', views.submit_request_page, name='submit_request'),
]