#!/usr/bin/env python
"""
Test Order Creation API Endpoint
This script tests the actual order creation endpoint via REST API.
"""
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, '/c/laragon/www/jojangocms3-modelform/backend')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User
from orders.models import Order

# Get test user with branch
user = User.objects.filter(username='agus').first()
if not user:
    print("❌ agus user not found!")
    sys.exit(1)

print(f"✅ Test User: {user.username}")
print(f"✅ Branch: {user.branch.name if user.branch else 'None'}")
print()

# Create JWT token for user
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

# Initialize API client
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("=" * 60)
print("Testing Order Creation API")
print("=" * 60)

# Test data
test_payload = {
    "service_type": "delivery",
    "pickup_location": "Situbondo",
    "drop_location": "Surabaya, Indonesia",
    "item_name": "Test Delivery Order",
    "quantity": 1,
    "unit_price": 50000,
    "extra_stops": [],
    "note": "Testing order creation",
}

print(f"\n📝 Payload:")
print(json.dumps(test_payload, indent=2))

# Test 1: Preview endpoint
print(f"\n1️⃣ Testing Preview Endpoint:")
print("   POST /api/orders/service-preview/")

response = client.post('/api/orders/service-preview/', test_payload, format='json')
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Response:")
    print(f"      Distance: {data.get('distance')} km")
    print(f"      Tarif: Rp {data.get('tarif'):,}")
    print(f"      Service Fee: Rp {data.get('service_fee'):,}")
    print(f"      Price: Rp {data.get('price'):,}")
    preview_price = data.get('price')
else:
    print(f"   ❌ Error: {response.content}")
    sys.exit(1)

# Test 2: Create order endpoint
print(f"\n2️⃣ Testing Order Creation Endpoint:")
print("   POST /api/orders/service-create/")

response = client.post('/api/orders/service-create/', test_payload, format='json')
print(f"   Status: {response.status_code}")

if response.status_code == 201:
    data = response.json()
    order_id = data['order'].get('id')
    order_code = data['order'].get('order_code')
    created_price = int(float(data['order'].get('total_price', 0)))
    
    print(f"   ✅ Order Created Successfully!")
    print(f"      Order ID: {order_id}")
    print(f"      Order Code: {order_code}")
    print(f"      Total Price: Rp {created_price:,}")
    
    # Verify price consistency
    if preview_price == created_price:
        print(f"   ✅ Price Consistency Check PASSED")
        print(f"      Preview Price: Rp {preview_price:,}")
        print(f"      Order Price: Rp {created_price:,}")
    else:
        print(f"   ❌ Price Mismatch!")
        print(f"      Preview Price: Rp {preview_price:,}")
        print(f"      Order Price: Rp {created_price:,}")
else:
    print(f"   ❌ Error: {response.status_code}")
    print(f"   Response: {response.content}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ All API tests passed!")
print("=" * 60)
