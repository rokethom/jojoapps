from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'device-tokens', views.DeviceTokenViewSet, basename='device-token')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'templates', views.NotificationTemplateViewSet, basename='notification-template')

urlpatterns = [
    path('', include(router.urls)),
    path('test-notification/', views.send_test_notification, name='test-notification'),
]