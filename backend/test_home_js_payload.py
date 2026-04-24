#!/usr/bin/env python
"""
Test Order Creation - Mimic Home.js payload
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
print("Testing Order Creation - Mimicking Home.js Payload")
print("=" * 60)

# This mimics what Home.js form contains
home_js_payload = {
    "service_type": "delivery",
    "customer_name": "Test Customer",
    "customer_phone": "081234567890",
    "customer_address": "Surabaya, Indonesia",
    "customer_address_lat": "-7.2462836",
    "customer_address_lng": "112.7377674",
    "pickup_address": "Situbondo",
    "pickup_address_lat": "",
    "pickup_address_lng": "",
    "drop_address": "",
    "drop_address_lat": "",
    "drop_address_lng": "",
    "recipient_name": "",
    "recipient_phone": "",
    "recipient_address": "",
    "recipient_address_lat": "",
    "recipient_address_lng": "",
    "purchase_address": "Situbondo",
    "purchase_address_lat": "",
    "purchase_address_lng": "",
    "item_name": "Test Item",
    "quantity": 1,
    "unit_price": 50000,
    "extra_stops": [],
    "price_service": 368000,
    "note": ""
}

print("\n1. Testing with Home.js field names (delivery):")
print(f"   Payload keys: {list(home_js_payload.keys())}")

response = client.post('/api/orders/service-create/', home_js_payload, format='json')

print(f"\n   Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    print(f"   ✅ Order created: {data['order'].get('order_code')}")
    print(f"   Price: Rp {int(float(data['order'].get('total_price', 0))):,}")
else:
    print(f"   ❌ Error response: {response.json()}")

# Now test with new service type
home_js_payload_new = home_js_payload.copy()
home_js_payload_new["service_type"] = "epajak"

print("\n2. Testing with new service type (epajak):")

response = client.post('/api/orders/service-create/', home_js_payload_new, format='json')

print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    print(f"   ✅ Order created: {data['order'].get('order_code')}")
    print(f"   Price: Rp {int(float(data['order'].get('total_price', 0))):,}")
else:
    print(f"   ❌ Error response: {response.json()}")

print("\n" + "=" * 60)
print("Testing completed!")
print("=" * 60)
