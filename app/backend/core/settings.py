"""
Data Connector Platform — Django Settings
DCP-02 | core/settings.py
"""
import os
from datetime import timedelta
from pathlib import Path
import dj_database_url
from core.logging import LOGGING  

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

LOGGING = LOGGING 

# ── Applications ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
]

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────
# JSONB support + ACID transactions → PostgreSQL (design p.13)
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL",
            "postgres://dcp_user:dcp_pass@localhost:5432/dcp_db"
        ),
        conn_max_age=600,
    )
}

# ── Custom User Model ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = "api.User"

# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Custom exception handler wired in DCP-19
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}

# ── JWT Configuration ─────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", 60))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7))
    ),
    "AUTH_HEADER_TYPES": ("Bearer",),
    # Embed role in JWT payload for RBAC checks (design p.3 — JWT via DRF)
    "TOKEN_OBTAIN_SERIALIZER": "api.serializers.RoleTokenObtainPairSerializer",
}

# ── Celery ────────────────────────────────────────────────────────────────────
# Decouples long-running 100MB extractions from the request cycle (design p.6)
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_TIME_LIMIT = 60          # Hard 60s timeout per task (design p.21)
CELERY_TASK_SOFT_TIME_LIMIT = 55     # Soft limit triggers graceful shutdown
CELERY_TASK_TRACK_STARTED = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Prevents memory spikes on large batches

# ── File Storage ──────────────────────────────────────────────────────────────
# Local Docker volume mount — MVP uses disk, not S3 (design p.3)
STORAGE_ROOT = os.environ.get("STORAGE_ROOT", str(BASE_DIR / "storage"))

# ── Batch Extraction Limits ───────────────────────────────────────────────────
# Caps per design p.3: 100MB / 10,000 rows max per request
BATCH_MAX_ROWS = int(os.environ.get("BATCH_MAX_ROWS", 10_000))
BATCH_CHUNK_SIZE = int(os.environ.get("BATCH_CHUNK_SIZE", 1_000))  # Sub-batch size

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# ── Internationalization ──────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"