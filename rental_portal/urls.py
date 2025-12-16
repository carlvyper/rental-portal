# rental_portal/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # THIS LINE IS CRUCIAL: It directs all /api/ traffic to the tenant_api app
    path('api/', include('tenant_api.urls')), 
]