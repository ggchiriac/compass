"""
Django settings for the hoagieplan project.
"""

import dj_database_url
import os
import sys

from pathlib import Path
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production! Toggle in .env
DEBUG = os.getenv('DEBUG') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'compass',
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Security settings
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE')
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE') == 'True'

# Authentication
AUTHENTICATION_BACKENDS = ('django.contrib.auth.backends.ModelBackend',)
AUTH_USER_MODEL = 'compass.CustomUser'

# URLs and CAS
HOMEPAGE = os.getenv('PUCOMPASS')
DASHBOARD = os.path.join(os.getenv('PUCOMPASS'), 'dashboard')
CAS_SERVER_URL = os.path.join(os.getenv('CAS_URL'), 'cas')

# CORS and CSRF settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    os.getenv('BACKEND'),
    os.getenv('PUCOMPASS'),
]
CSRF_TRUSTED_ORIGINS = [
    os.getenv('PUCOMPASS'),
    os.getenv('BACKEND'),
]

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
        'propagate': True,
    },
}

# URLs and templates
ROOT_URLCONF = 'config.urls'
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

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(default=os.getenv('DATABASE_URL')),
}

# Use in-memory SQLite database for testing
if 'test' in sys.argv or 'test_coverage' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

CONN_MAX_AGE = None

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'EST'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Apply Heroku settings
if 'ON_HEROKU' in os.environ:
    import django_heroku
    django_heroku.settings(locals())
    del DATABASES['default']['OPTIONS']['sslmode']
