#!/usr/bin/env python
"""
Test registration flow to identify errors
"""
import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.serializers import RegisterSerializer
from users.models import User, UserProfile
from branch.models import Branch
import json

# Create unique usernames using timestamp
timestamp = int(time.time())

# Test 1: Registration without location (should fail if no branch selected)
print("\n" + "="*60)
print("TEST 1: Registration WITHOUT location or branch")
print("="*60)

payload = {
    "username": f"testuser_{timestamp}_1",
    "password": "TestPass123",
    "name": "Test User 1",
    "phone": "081234567890"
}

print(f"\nPayload: {json.dumps(payload, indent=2)}")
serializer = RegisterSerializer(data=payload)
if serializer.is_valid():
    print(f"✅ Valid serializer")
    user = serializer.save()
    print(f"✅ User created: {user.username}")
    print(f"   - ID: {user.id}")
    print(f"   - Name: {user.first_name}")
    print(f"   - Phone: {user.phone}")
    print(f"   - Role: {user.role}")
    print(f"   - Branch: {user.branch}")
else:
    print(f"❌ Serializer errors: {json.dumps(serializer.errors, indent=2)}")

# Test 2: Registration with location
print("\n" + "="*60)
print("TEST 2: Registration WITH location")
print("="*60)

payload = {
    "username": f"testuser_{timestamp}_2",
    "password": "TestPass123",
    "name": "Test User 2",
    "phone": "081234567891",
    "latitude": -7.2504,
    "longitude": 112.7581
}

print(f"\nPayload: {json.dumps(payload, indent=2)}")
serializer = RegisterSerializer(data=payload)
if serializer.is_valid():
    print(f"✅ Valid serializer")
    user = serializer.save()
    print(f"✅ User created: {user.username}")
    print(f"   - ID: {user.id}")
    print(f"   - Name: {user.first_name}")
    print(f"   - Phone: {user.phone}")
    print(f"   - Role: {user.role}")
    print(f"   - Branch: {user.branch}")
else:
    print(f"❌ Serializer errors: {json.dumps(serializer.errors, indent=2)}")

# Test 3: Registration with branch_id
if Branch.objects.exists():
    print("\n" + "="*60)
    print("TEST 3: Registration WITH branch_id")
    print("="*60)
    
    branch = Branch.objects.first()
    payload = {
        "username": f"testuser_{timestamp}_3",
        "password": "TestPass123",
        "name": "Test User 3",
        "phone": "081234567892",
        "branch_id": branch.id
    }
    
    print(f"\nPayload: {json.dumps(payload, indent=2)}")
    serializer = RegisterSerializer(data=payload)
    if serializer.is_valid():
        print(f"✅ Valid serializer")
        user = serializer.save()
        print(f"✅ User created: {user.username}")
        print(f"   - ID: {user.id}")
        print(f"   - Name: {user.first_name}")
        print(f"   - Phone: {user.phone}")
        print(f"   - Role: {user.role}")
        print(f"   - Branch: {user.branch}")
    else:
        print(f"❌ Serializer errors: {json.dumps(serializer.errors, indent=2)}")

# Test 4: Invalid registration (empty name should fail)
print("\n" + "="*60)
print("TEST 4: Invalid registration (empty name)")
print("="*60)

payload = {
    "username": f"testuser_{timestamp}_4",
    "password": "TestPass123",
    "name": "",
    "phone": "081234567893"
}

print(f"\nPayload: {json.dumps(payload, indent=2)}")
serializer = RegisterSerializer(data=payload)
if serializer.is_valid():
    print(f"❌ Should not be valid (empty name)")
else:
    print(f"✅ Expected error: {json.dumps(serializer.errors, indent=2)}")

print("\n" + "="*60)
print("TESTING COMPLETE")
print("="*60)
