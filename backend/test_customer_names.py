#!/usr/bin/env python
"""
Test script to verify customer names in orders API
Run: python test_customer_names.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_customer_names():
    """Test that customer names are properly displayed in orders API"""

    print("\n" + "="*70)
    print("🧪 CUSTOMER NAMES TEST")
    print("="*70)

    # Get admin user for testing
    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        print("❌ No admin user found!")
        return

    print(f"✅ Using admin user: {admin_user.username}")

    # Create API client and authenticate
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    # Test orders endpoint
    response = client.get('/api/orders/')
    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        print(response.data)
        return

    orders = response.data
    print(f"✅ Found {len(orders)} orders")

    # Check customer names
    for i, order in enumerate(orders[:3]):  # Check first 3 orders
        customer_name = order.get('customer_name', '')
        print(f"Order {i+1}: customer_name = '{customer_name}'")

        if not customer_name:
            print("  ⚠️  Empty customer name!")
        elif customer_name == 'Guest':
            print("  ❌ Still showing 'Guest'!")
        else:
            print("  ✅ Proper customer name")

    print("\n✅ Test completed!")

if __name__ == '__main__':
    test_customer_names()