#!/usr/bin/env python
"""
Test chat endpoint to identify 500 error
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIClient
from users.models import User
from chat.models import ChatMessage, ChatRoom
from chat.serializers import ChatMessageSerializer
import json

client = APIClient()

# Get test users
try:
    customer = User.objects.filter(role='customer').first()
    driver = User.objects.filter(role='driver').first()

    if not customer:
        print("❌ No customer user found")
        exit(1)

    if not driver:
        print("❌ No driver user found")
        exit(1)

    print(f"✅ Found customer: {customer.username} (ID: {customer.id})")
    print(f"✅ Found driver: {driver.username} (ID: {driver.id})")

    # Authenticate as customer
    client.force_authenticate(user=customer)

    print("\n" + "="*60)
    print("TEST 1: Customer sending message to driver")
    print("="*60)

    payload = {
        "message": "Hello driver, I need help with my order",
        "customer_id": driver.id
    }

    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = client.post("/api/chat/", payload, format='json')
        print(f"Status: {response.status_code}")
        if hasattr(response, 'data'):
            if response.status_code == 201:
                print("✅ Message sent successfully")
                print(f"Response: {json.dumps(response.data, indent=2, default=str)}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {json.dumps(response.data, indent=2, default=str)}")
        else:
            print(f"❌ No data attribute in response")
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "="*60)
    print("TEST 2: Customer fetching messages")
    print("="*60)

    try:
        response = client.get(f"/api/chat/?customer_id={driver.id}")
        print(f"Status: {response.status_code}")
        if hasattr(response, 'data'):
            if response.status_code == 200:
                print("✅ Messages fetched successfully")
                print(f"Response count: {len(response.data)}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {json.dumps(response.data, indent=2, default=str)}")
        else:
            print(f"❌ No data attribute in response")
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "="*60)
    print("TEST 3: Driver sending message to customer")
    print("="*60)

    # Authenticate as driver
    client.force_authenticate(user=driver)

    payload = {
        "message": "Hello customer, I'm on my way",
        "customer_id": customer.id
    }

    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = client.post("/api/chat/", payload, format='json')
        print(f"Status: {response.status_code}")
        if hasattr(response, 'data'):
            if response.status_code == 201:
                print("✅ Message sent successfully")
                print(f"Response: {json.dumps(response.data, indent=2, default=str)}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {json.dumps(response.data, indent=2, default=str)}")
        else:
            print(f"❌ No data attribute in response")
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

except Exception as e:
    print(f"❌ Setup error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("TESTING COMPLETE")
print("="*60)