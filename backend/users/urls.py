from django.urls import path
from .views import me, register, user_list, favorite_locations, unsuspend_user, suspend_user, google_oauth2_login

urlpatterns = [
    path('me/', me),
    path('register/', register),
    path('users/', user_list),
    path('users/<int:user_id>/unsuspend/', unsuspend_user),
    path('users/<int:user_id>/suspend/', suspend_user),
    path('favorite-locations/', favorite_locations),
    path('google-login/', google_oauth2_login),
]