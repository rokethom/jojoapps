#!/usr/bin/env python
"""
Test Order Creation with All Service Types
This script tests the order creation API with all service types to verify the fix.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, '/c/laragon/www/jojangocms3-modelform/backend')
django.setup()

from users.models import User
from branch.models import Branch
from orders.views import build_service_payload, validate_service_payload, calculate_service_pricing

# Get test user with branch
user = User.objects.filter(branch__isnull=False).first()
if not user:
    print("❌ No user with branch found!")
    sys.exit(1)

print(f"✅ Test User: {user.username}")
print(f"✅ Branch: {user.branch.name}")
print()

# All service types from frontend
service_types = [
    "delivery", "ojek", "kurir", "gift", "jojosehat", "belanja",
    "epajak", "etilang", "travel", "joker_mobil"
]

print("=" * 60)
print("Testing Order Creation for All Service Types")
print("=" * 60)

for service_type in service_types:
    print(f"\n📌 Testing: {service_type.upper()}")
    
    # Build payload
    test_data = {
        "service_type": service_type,
        "pickup_location": "Situbondo",
        "drop_location": "Surabaya, Indonesia",
        "item_name": f"Test {service_type}",
        "quantity": 1,
        "unit_price": 50000,
        "extra_stops": [],
        "note": f"Testing {service_type}",
    }
    
    # Add recipient for gift/kurir
    if service_type in {"gift", "kurir"}:
        test_data["recipient_name"] = "John Doe"
        test_data["recipient_phone"] = "081234567890"
    
    try:
        # Build payload
        payload = build_service_payload(user, test_data)
        print(f"  ✅ Payload built: {payload['service_type']}")
        
        # Validate payload
        errors = validate_service_payload(payload)
        if errors:
            print(f"  ❌ Validation errors: {errors}")
            continue
        print(f"  ✅ Validation passed")
        
        # Calculate pricing
        pricing = calculate_service_pricing(user, payload)
        print(f"  ✅ Pricing calculated: Rp {pricing['price']:,}")
        print(f"     Distance: {pricing['distance']} km")
        print(f"     Tarif: Rp {pricing['tarif']:,}")
        print(f"     Service Fee: Rp {pricing['service_fee']:,}")
        
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("✅ All service types tested successfully!")
print("=" * 60)
