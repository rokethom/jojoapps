from django.urls import path
from .views import ChatbotAPIView
from .views_rocket import RocketWebhookView

urlpatterns = [
    path('', ChatbotAPIView.as_view()),  # Existing (Web Chat)
    path('rocket/webhook', RocketWebhookView.as_view()), # Rocket.Chat Webhook
]