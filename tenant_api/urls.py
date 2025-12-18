# tenant_api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth API
    path('register/', views.RegisterView.as_view(), name='api_register'),
    path('login/', views.LoginView.as_view(), name='api_login'),
    path('logout/', views.LogoutView.as_view(), name='api_logout'),
    
    # Data API
    path('profile/', views.UserProfileView.as_view(), name='api_profile_detail'),
    path('change-password/', views.ChangePasswordView.as_view(), name='api_change_password'),
    path('payments/', views.PaymentListCreateView.as_view(), name='api_payments'),
    path('complaints/', views.ComplaintListCreateView.as_view(), name='api_complaints'),
    path('requests/', views.RequestListCreateView.as_view(), name='api_requests'),
    path('notifications/', views.NotificationListView.as_view(), name='api_notification_list'),
    path('dashboard-counts/', views.DashboardCountsView.as_view(), name='api_dashboard_counts'),
    
    # M-Pesa & Utility
    path('initiate-stk-push/', views.initiate_stk_push, name='initiate_stk_push'),
    path('stk-callback/', views.stk_callback, name='stk_callback'),
    path('check-status/<str:checkout_id>/', views.check_payment_status, name='check_status'),
    path('download-receipt/<int:transaction_id>/', views.download_receipt, name='download-receipt'),
]