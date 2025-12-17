# tenant_api/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('register/', views.register_page, name='register'), # This fixes the 404
    # Authentication Endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # Profile Endpoints
    path('profile/', views.UserProfileView.as_view(), name='profile-detail'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Data Submission/Fetch Endpoints
    path('payments/', views.PaymentListCreateView.as_view(), name='payments'),
    path('complaints/', views.ComplaintListCreateView.as_view(), name='complaints'),
    path('requests/', views.RequestListCreateView.as_view(), name='requests'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    
    # Utility Endpoint
    path('dashboard-counts/', views.DashboardCountsView.as_view(), name='dashboard-counts'),
    #  M-Pesa Endpoints
    path('initiate-stk-push/', views.initiate_stk_push, name='initiate_stk_push'),
    path('stk-callback/', views.stk_callback, name='stk_callback'),
    path('check-status/', views.check_payment_status, name='check_status'),
    
    path('download-receipt/<int:payment_id>/', views.download_receipt, name='download-receipt'),
]