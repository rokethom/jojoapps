from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# =========================================
# BASIC
# =========================================
SECRET_KEY = os.getenv('SECRET_KEY') 
DEBUG = True
ALLOWED_HOSTS = ["*"]
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000"]

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

LOGIN_URL = '/admin/login/'
LOGIN_REDIRECT_URL = '/admin/'

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600
SESSION_SAVE_EVERY_REQUEST = True


# =========================================
# INSTALLED APPS
# =========================================
INSTALLED_APPS = [
    'jazzmin',  # 🔥 HARUS PALING ATAS

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',

    # apps
    'users.apps.UsersConfig',
    'branch',
    'orders.apps.OrdersConfig',
    'chat',
    'chatbot',
    'pricing',
    'cms',
    'dashboard',
    'settlement',
    'notifications',
    "corsheaders",
]

# =========================================
# AUTH
# =========================================
AUTH_USER_MODEL = 'users.User'

# =========================================
# DRF
# =========================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# =========================================
# DATABASE (POSTGRESQL)
# =========================================
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE'),
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# =========================================
# FCM (Firebase Cloud Messaging)
# =========================================
FCM_PROJECT_ID = os.getenv('FCM_PROJECT_ID')
FCM_PROJECT_NUMBER = os.getenv('FCM_PROJECT_NUMBER')
FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY')

# FCM Service Account (JSON format)
FCM_SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": os.getenv('FCM_PROJECT_ID'),
    "private_key_id": os.getenv('FCM_PRIVATE_KEY_ID'),
    "private_key": os.getenv('FCM_PRIVATE_KEY'),
    "client_email": os.getenv('FCM_CLIENT_EMAIL'),
    "client_id": os.getenv('FCM_CLIENT_ID'),
    "auth_uri": os.getenv('FCM_AUTH_URI'),
    "token_uri": os.getenv('FCM_TOKEN_URI'),
    "auth_provider_x509_cert_url": os.getenv('FCM_AUTH_PROVIDER_CERT_URL'),
    "client_x509_cert_url": os.getenv('FCM_CLIENT_CERT_URL'),
    "universe_domain": os.getenv('FCM_UNIVERSE_DOMAIN')
}

# =========================================
# NOTIFICATION SETTINGS
# =========================================
NOTIFICATION_SPAM_PROTECTION = {
    'MAX_NOTIFICATIONS_PER_HOUR': 10,  # Max notifications per user per hour
    'MIN_INTERVAL_SECONDS': 30,        # Minimum interval between notifications
    'ANTI_SPAM_WINDOW_MINUTES': 60,    # Time window for spam protection
}

NOTIFICATION_PRIORITIES = {
    'LOW': 1,
    'NORMAL': 2,
    'HIGH': 3,
    'URGENT': 4,
    'CRITICAL': 5,
}

# =========================================
# GOOGLE OAUTH2 SETTINGS
# =========================================
GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')
GOOGLE_OAUTH2_REDIRECT_URI = os.getenv('GOOGLE_OAUTH2_REDIRECT_URI')

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # WAJIB DI ATAS
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'core.middleware.AutoClearExpiredSuspensionsMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================================
# URL / TEMPLATE
# =========================================
ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # 🔥 TAMBAHKAN INI
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',

            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

# =========================================
# PASSWORD VALIDATION
# =========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =========================================
# INTERNATIONAL
# =========================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =========================================
# STATIC
# =========================================
STATIC_URL = 'static/'

# SOURCE (tempat kamu taruh file)
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# OUTPUT (hasil collectstatic)
STATIC_ROOT = BASE_DIR / "staticfiles"

CORS_ALLOW_ALL_ORIGINS = True

CSRF_TRUSTED_ORIGINS = [
    "https://*.ngrok-free.app"
]


# =========================================
# JAZZMIN CONFIG (RAPI)
# =========================================
JAZZMIN_SETTINGS = {
    "site_title": "Jojo Admin",
    "site_header": "Jojo CMS",
    "site_brand": "JojoSystem",

    "welcome_sign": "Selamat datang di Jojo CMS 🚀",
    "theme": "cyborg",        # 🔥 INI WAJIB
    "dark_mode_theme": "darkly",

    "site_logo": None,
    "login_logo": None,
    "site_logo_classes": "img-circle",

    "show_sidebar": True,
    "navigation_expanded": True,

    "topmenu_links": [
        {"name": "Home", "url": "admin:index"},
    ],

    "icons": {
        "users.User": "fas fa-user",
        "orders.Order": "fas fa-box",
        "chat.ChatMessage": "fas fa-comments",
        "branch.Branch": "fas fa-building",
        "pricing.PriceSetting": "fas fa-money-bill",
        "cms.CMSBanner": "fas fa-image",
        "cms.CMSPromo": "fas fa-bullhorn",
    },

    "order_with_respect_to": [
        "users",
        "branch",
        "orders",
        "chat",
        "chatbot",
        "pricing",
        "cms",
    ],

    "custom_links": {
        "orders": [{
            "name": "Dashboard",
            "url": "/api/dashboard/stats/",
            "icon": "fas fa-chart-line"
        }]
    },

    "hide_models": [
    "auth.group",
],

    
}


