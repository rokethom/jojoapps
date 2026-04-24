from django.urls import path
from .views import DashboardStatsAPI
from .views import DashboardAPIView

urlpatterns = [
    path('dashboard/stats/', DashboardStatsAPI.as_view()),
    path('dashboard/', DashboardAPIView.as_view()),
]