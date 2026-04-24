from django.urls import path
from .views import PricingAPIView

app_name = 'pricing'

urlpatterns = [
    path('calculate/', PricingAPIView.as_view(), name='calculate-price'),
]
