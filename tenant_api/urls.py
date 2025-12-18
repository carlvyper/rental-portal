# tenant_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- FRONTEND HTML PAGE ROUTES ---
    # These are the URLs you type into your browser address bar
    path('', views.home_page, name='home'),
    path('register/', views.register_page, name='register_page'),
    path('dashboard/', views.dashboard_page, name='dashboard'),
    path('profile/', views.profile_page, name='profile_page'),
    path('pay-rent/', views.pay_rent_page, name='pay_rent'),
    path('payment-history/', views.payment_history_page, name='payment_history'),
    path('notifications/', views.notifications_page, name='notifications_page'),
    path('submit-complaint/', views.submit_complaint_page, name='submit_complaint'),
    path('submit-request/', views.submit_request_page, name='submit_request'),

    # --- BACKEND API ENDPOINTS ---
    # These are used by your JavaScript fetch() calls
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/logout/', views.LogoutView.as_view(), name='api_logout'),
    
    path('api/profile/', views.UserProfileView.as_view(), name='api_profile_detail'),
    path('api/change-password/', views.ChangePasswordView.as_view(), name='api_change_password'),
    
    path('api/payments/', views.PaymentListCreateView.as_view(), name='api_payments'),
    path('api/complaints/', views.ComplaintListCreateView.as_view(), name='api_complaints'),
    path('api/requests/', views.RequestListCreateView.as_view(), name='api_requests'),
    path('api/notifications/', views.NotificationListView.as_view(), name='api_notification_list'),
    
    path('api/dashboard-counts/', views.DashboardCountsView.as_view(), name='api_dashboard_counts'),
    
    # M-Pesa & Utility Endpoints
    path('api/initiate-stk-push/', views.initiate_stk_push, name='initiate_stk_push'),
    path('api/stk-callback/', views.stk_callback, name='stk_callback'),
    path('api/check-status/<str:checkout_id>/', views.check_payment_status, name='check_status'),
    path('api/download-receipt/<int:transaction_id>/', views.download_receipt, name='download-receipt'),
]