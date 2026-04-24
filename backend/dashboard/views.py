from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from orders.models import Order
from users.models import User
from users.permissions import IsAdmin


class DashboardStatsAPI(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):

        total_order = Order.objects.count()
        pending = Order.objects.filter(status='pending').count()
        on_delivery = Order.objects.filter(status='on_delivery').count()

        driver_online = User.objects.filter(role='driver', is_active=True).count()
        suspended_drivers = User.objects.filter(role='driver', is_suspended=True).count()

        return Response({
            "total_order": total_order,
            "pending": pending,
            "on_delivery": on_delivery,
            "driver_online": driver_online,
            "suspended_drivers": suspended_drivers,
        })
    
class DashboardAPIView(APIView):
    def get(self, request):
        return Response({
            "total_orders": Order.objects.count(),
            "pending_orders": Order.objects.filter(status="pending").count(),
            "drivers_online": User.objects.filter(role="driver", is_active=True).count(),
            "suspended_drivers": User.objects.filter(role="driver", is_suspended=True).count(),
        })