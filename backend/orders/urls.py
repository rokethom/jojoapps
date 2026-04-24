from rest_framework.routers import DefaultRouter
from .views import (
    DriverRequestOrderAPI,
    OrderViewSet,
    ServiceOrderCreateAPI,
    ServiceOrderPreviewAPI,
)
from django.urls import path

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('driver/request-order/', DriverRequestOrderAPI.as_view()),
    path('orders/service-preview/', ServiceOrderPreviewAPI.as_view()),
    path('orders/service-create/', ServiceOrderCreateAPI.as_view()),
] + router.urls
