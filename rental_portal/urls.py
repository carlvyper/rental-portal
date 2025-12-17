from django.contrib import admin
from django.urls import path, include
from tenant_api.views import home_page # Import the home view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tenant_api.urls')),
    
    # THIS LINE SERVES YOUR FRONTEND AT https://rental-portal-5ma1.onrender.com/
    path('', home_page, name='home'), 
]