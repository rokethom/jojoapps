from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.contrib import admin
from django.urls import path, include




urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),

    path('api/', include('orders.urls')),
    path('api/', include('chat.urls')),

    path('api/', include('cms.urls')),
    path('api/', include('dashboard.urls')),

    path('api/auth/', include('users.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/pricing/', include('pricing.urls')),
    path('api/branch/', include('branch.urls')),
    path('api/settlement/', include('settlement.urls')),
    path('api/notifications/', include('notifications.urls')),
    
]