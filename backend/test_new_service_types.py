#!/usr/bin/env python
"""
Test Order Creation with New Service Types
"""
import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, '/c/laragon/www/jojangocms3-modelform/backend')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User

user = User.objects.filter(username='agus').first()
if not user:
    print("ERROR: agus user not found!")
    sys.exit(1)

refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("=" * 60)
print("Testing Order Creation with NEW Service Types")
print("=" * 60)

# Test new service types
new_types = ["epajak", "etilang", "travel", "joker_mobil"]

for service_type in new_types:
    print(f"\nTesting: {service_type.upper()}")
    
    payload = {
        "service_type": service_type,
        "pickup_location": "Situbondo",
        "drop_location": "Surabaya, Indonesia",
        "item_name": f"Test {service_type}",
        "quantity": 1,
        "unit_price": 50000,
        "extra_stops": [],
    }
    
    response = client.post('/api/orders/service-create/', payload, format='json')
    
    if response.status_code == 201:
        data = response.json()
        order_code = data['order'].get('order_code')
        price = int(float(data['order'].get('total_price', 0)))
        print(f"   SUCCESS! Order: {order_code}, Price: Rp {price:,}")
    else:
        print(f"   FAILED! Status: {response.status_code}")
        print(f"   Error: {response.content}")

print("\n" + "=" * 60)
print("Testing completed!")
print("=" * 60)
