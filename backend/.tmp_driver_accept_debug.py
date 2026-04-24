import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()
from orders.views import OrderViewSet
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from orders.models import Order

User = get_user_model()
driver = User.objects.filter(role='driver').first()
print('driver', driver)
print('order exists', Order.objects.filter(pk=15).exists())
print('order', Order.objects.get(pk=15))

factory = APIRequestFactory()
request = factory.post('/api/orders/15/driver_accept/')
request.user = driver
view = OrderViewSet.as_view({'post': 'driver_accept'})
response = view(request, pk='15')
print('status', response.status_code)
print('data', getattr(response, 'data', None))
