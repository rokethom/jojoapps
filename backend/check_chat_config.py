#!/usr/bin/env python
"""
CHAT SYSTEM CONFIGURATION CHECKER
Verify all components are properly set up
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from chat.models import ChatRoom, ChatMessage
from orders.models import Order
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("=" * 70)
print("🔍 CHAT SYSTEM CONFIGURATION CHECK")
print("=" * 70)

# 1. Check Users
print("\n1. 👥 USERS CHECK")
customers = User.objects.filter(role='customer')
drivers = User.objects.filter(role='driver')
print(f"   ✓ Customers: {customers.count()}")
print(f"   ✓ Drivers: {drivers.count()}")

if customers.count() == 0:
    print("   ⚠️  WARNING: No customers found!")
if drivers.count() == 0:
    print("   ⚠️  WARNING: No drivers found!")

# Show first few users
for u in User.objects.all()[:5]:
    role = getattr(u, 'role', 'ERROR-NO-ROLE')
    token = "✓ Has Token" if RefreshToken.for_user(u).access_token else "✗ No Token"
    print(f"   - ID:{u.id} {u.email:30s} role={role:10s}")

# 2. Check Models
print("\n2. 📦 MODELS CHECK")
print(f"   ✓ ChatRoom count: {ChatRoom.objects.count()}")
print(f"   ✓ ChatMessage count: {ChatMessage.objects.count()}")

# 3. Check API Endpoint
print("\n3. 🔗 API ENDPOINT CHECK")
from rest_framework.test import APIClient
from rest_framework.test import APIRequestFactory

client = APIClient()
print("   Checking: GET /api/chat/")

# Try without authentication
response = client.get('/api/chat/')
if response.status_code == 401:
    print("   ✓ Endpoint requires authentication (good!)")
elif response.status_code == 404:
    print("   ✗ ERROR: Endpoint not found (404)")
else:
    print(f"   ? Unexpected status: {response.status_code}")

# 4. Check Authentication
print("\n4. 🔐 AUTHENTICATION CHECK")
if customers.exists():
    customer = customers.first()
    try:
        refresh = RefreshToken.for_user(customer)
        access = str(refresh.access_token)
        print(f"   ✓ Can generate token for customer")
        print(f"   ✓ Token length: {len(access)} chars")
        
        # Test authenticated request
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = client.get('/api/chat/')
        print(f"   ✓ Authenticated request status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✓ Can fetch messages (found {len(response.data)})")
    except Exception as e:
        print(f"   ✗ Token error: {e}")

# 5. Check Serializers
print("\n5. 📋 SERIALIZER CHECK")
from chat.serializers import ChatMessageSerializer
from chat.models import ChatMessage
sample_msg = ChatMessage.objects.first()
if sample_msg:
    serializer = ChatMessageSerializer(sample_msg)
    print(f"   ✓ Sample message fields:")
    for field in ['id', 'message', 'created_at', 'sender_type', 'sender_id', 'room']:
        if field in serializer.data:
            print(f"      - {field}: ✓")
        else:
            print(f"      - {field}: ✗ MISSING")

# 6. Check Filters
print("\n6. 🔎 FILTER LOGIC CHECK")
if customers.exists() and drivers.exists():
    cust = customers.first()
    driver = drivers.first()
    
    # Create test message
    from chat.models import ChatRoom
    room, created = ChatRoom.objects.get_or_create(
        customer=cust,
        driver=driver,
        defaults={'order': None}
    )
    
    msg = ChatMessage.objects.create(
        room=room,
        sender_type='customer',
        sender_id=cust.id,
        message='Test message'
    )
    
    # Test customer filter
    cust_msgs = ChatMessage.objects.filter(
        room__customer=cust,
        room__driver_id=driver.id
    )
    
    # Test driver filter
    driver_msgs = ChatMessage.objects.filter(
        room__customer_id=cust.id,
        room__driver=driver
    )
    
    print(f"   ✓ Customer query found: {cust_msgs.count()} messages")
    print(f"   ✓ Driver query found: {driver_msgs.count()} messages")
    
    if cust_msgs.count() > 0 and driver_msgs.count() > 0:
        print("   ✓ Both filters working!")
    
    # Cleanup
    msg.delete()

# 7. Summary
print("\n" + "=" * 70)
print("✅ CONFIGURATION CHECK COMPLETE")
print("=" * 70)
print("""
Next steps:
1. If all checks passed, frontend should work
2. Open browser console (F12) to see logs
3. Check Django server logs for errors
4. Run test_chat_api.py for API test
""")
