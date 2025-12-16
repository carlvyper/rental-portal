from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Core Settings ---
SECRET_KEY = 'django-insecure-@5002z*1g1c%^k1!x76d=j-n&p95g^%c25m02g#s0v2-r^!90d'
DEBUG = True

# CRITICAL: Django must allow the Ngrok domain to receive the callback from Safaricom
ALLOWED_HOSTS = [
    'localhost', 
    '127.0.0.1', 
    'https://rental-portal-5ma1.onrender.com'  # my current active render  URL
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'django_daraja', 
    
    # Local apps
    'tenant_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'rental_portal.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'rental_portal.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django Rest Framework Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', 
    ),
}

# --- CORS & CSRF Settings ---
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True 
CSRF_TRUSTED_ORIGINS = [
    "https://rental-portal-5ma1.onrender.com",
    "https://faef476751b2.ngrok-free.app", # Add Ngrok to trusted origins
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500",  # <--- ADD THIS (VS Code Live Server)
    "http://localhost:5500",   # <--- ADD THIS JUST IN CASE
]

# ===============================================
# ⭐ MPESA DARAJA CONFIGURATION (REQUIRED FORMAT) ⭐
# ===============================================
# The django-daraja library looks for these exact variable names

MPESA_ENVIRONMENT = 'sandbox'

# Credentials from your Daraja Portal
MPESA_CONSUMER_KEY = 'NB239fzMUcdMafjbDWJoYbVAdam4Gd8vNFvOAHGMx6XUexZh'
MPESA_CONSUMER_SECRET = 'X1UgBRJ5uJFqiJVPyXQJWa5yi6WahOCVA5pDmaAGF7e9zFnhuc6X3GZ6CETdvFIT'

# Standard Sandbox Shortcodes
MPESA_SHORTCODE = '174379'
MPESA_EXPRESS_SHORTCODE = '174379'

# Universal Sandbox Passkey (Standard for testing)
MPESA_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'

# THE CALLBACK BRIDGE
# Safaricom will send the result of your PIN entry here
MPESA_CALLBACK_URL = 'https://rental-portal-5ma1.onrender.com/api/stk-callback/'
# REFERENCE ONLY: Your Sandbox Whitelisted Number
# TEST_PHONE_NUMBER = '254799802804'