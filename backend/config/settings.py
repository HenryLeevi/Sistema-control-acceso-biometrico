"""
Django settings for the Biometric Access Control System.

Reads all secrets from environment variables via python-dotenv.
DO NOT hardcode credentials here.
"""

import os
from pathlib import Path
from datetime import timedelta

import dj_database_url
from dotenv import load_dotenv

# ─────────────────────────────────────────
# Base directory & .env loading
# ─────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ─────────────────────────────────────────
# Security
# ─────────────────────────────────────────
SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if os.getenv("CSRF_TRUSTED_ORIGINS") else []

# ─────────────────────────────────────────
# Application definition
# ─────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "channels",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.users",
    "apps.roles",
    "apps.auth_app",
    "apps.biometric",
    "apps.devices",
    "apps.access",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# ─────────────────────────────────────────
# Templates
# ─────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ─────────────────────────────────────────
# ASGI / WSGI
# ─────────────────────────────────────────
ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"

# ─────────────────────────────────────────
# Database (via dj-database-url)
# SSL is specified in DATABASE_URL (?sslmode=require)
# ─────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///db.sqlite3")
DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
    )
}

print(f'Current database engine is {DATABASES["default"]["ENGINE"]} → {DATABASES["default"]["NAME"]}')


# ─────────────────────────────────────────
# Password validation
# ─────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─────────────────────────────────────────
# Internationalisation
# ─────────────────────────────────────────
LANGUAGE_CODE = "es-sv"
TIME_ZONE = "America/El_Salvador"
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────
# Static & Media files
# ─────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ─────────────────────────────────────────
# Default primary key
# ─────────────────────────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─────────────────────────────────────────
# Django REST Framework
# ─────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ─────────────────────────────────────────
# Simple JWT Configuration
# ─────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", 60))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "SIGNING_KEY": os.getenv("JWT_SIGNING_KEY", SECRET_KEY),
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "apps.auth_app.serializers.CustomTokenObtainPairSerializer",
}

# ─────────────────────────────────────────
# Django Channels
# ─────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        # Using in-memory for development.
        # Switch to RedisChannelLayer for production:
        # "BACKEND": "channels_redis.core.RedisChannelLayer",
        # "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# ─────────────────────────────────────────
# CORS
# ─────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ─────────────────────────────────────────
# Azure AI Face (loaded from env — no defaults)
# ─────────────────────────────────────────
AZURE_FACE_ENDPOINT = os.getenv("AZURE_FACE_ENDPOINT", "")
AZURE_FACE_SUBSCRIPTION_KEY = os.getenv("AZURE_FACE_SUBSCRIPTION_KEY", "")
AZURE_FACE_PERSON_GROUP_ID = os.getenv("AZURE_FACE_PERSON_GROUP_ID", "")

# ─────────────────────────────────────────
# Azure Blob Storage
# ─────────────────────────────────────────
AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME", "")
AZURE_STORAGE_ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY", "")
AZURE_STORAGE_CONTAINER_NAME = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "biometric-images")
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
