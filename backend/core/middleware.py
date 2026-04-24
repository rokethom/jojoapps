from django.utils import timezone

from users.models import User


class AutoClearExpiredSuspensionsMiddleware:
    """Clear expired driver suspensions automatically on each request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        now = timezone.now()
        cleared = User.objects.filter(is_suspended=True, suspended_until__lte=now).update(
            is_suspended=False,
            suspension_reason="",
            suspended_until=None,
        )

        response = self.get_response(request)
        if cleared:
            response["X-Expired-Suspensions-Cleared"] = str(cleared)
        return response
