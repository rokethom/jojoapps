from django.urls import path
from .views import (
    BranchListView, GeocodeView, GeofenceAreaListView,
    validate_location, get_user_location_history
)

app_name = 'branch'

urlpatterns = [
    path('list/', BranchListView.as_view(), name='branch-list'),
    path("geocode/", GeocodeView.as_view()),

    # Geofencing endpoints
    path('geofence-areas/', GeofenceAreaListView.as_view(), name='geofence-areas'),
    path('geofence-areas/<int:branch_id>/', GeofenceAreaListView.as_view(), name='branch-geofence-areas'),
    path('validate-location/', validate_location, name='validate-location'),
    path('location-history/', get_user_location_history, name='location-history'),
]
