from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse # Add this import

# A tiny view just for the home page
def home_view(request):
    return HttpResponse("<h1>Welcome to the Rental Portal API</h1><p>Visit <a href='/admin'>/admin</a> to login.</p>")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tenant_api.urls')), 
    path('', home_view), # This fixes the 404 at the root URL
]