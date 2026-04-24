from rest_framework.permissions import BasePermission
from .utils import has_role


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, ['admin'])