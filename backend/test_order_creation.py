#!/usr/bin/env python
"""
Debug script untuk test chatbot order creation flow
Run: python test_order_creation.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from chatbot.services.chat_engine import process_message
from orders.models import Order

User = get_user_model()

def test_order_flow():
    """Test complete order flow from start to confirmation"""
    
    print("\n" + "="*70)
    print("🧪 CHATBOT ORDER CREATION TEST")
    print("="*70)
    
    # Get test user or create one
    user = User.objects.filter(role='customer').first()
    if not user:
        print("❌ No customer user found!")
        print("ℹ️  Create a customer user first in admin or run:")
        print("   python manage.py createsuperuser")
        return
    
    print(f"✅ Using user: {user.username} ({user.email})")
    print(f"✅ User branch: {user.branch}")
    print(f"✅ User phone: {user.phone}")
    
    # Count initial orders
    initial_count = Order.objects.count()
    print(f"\n📊 Initial order count: {initial_count}")
    
    # Simulate conversation
    messages = [
        "ojek",                    # Select service
        "Jl. Gatot Subroto",      # Pickup location
        "Jl. Sudirman 123",       # Drop location
    ]
    
    print("\n" + "-"*70)
    print("📱 SIMULATING CHAT CONVERSATION")
    print("-"*70 + "\n")
    
    for i, msg in enumerate(messages, 1):
        print(f"\n[Message {i}] User: '{msg}'")
        response = process_message(user, msg)
        print(f"[Response {i}] Bot:\n{response}\n")
    
    # User confirms
    print("\n[Message 4] User: 'ya' (CONFIRMATION)")
    response = process_message(user, "ya")
    print(f"[Response 4] Bot:\n{response}\n")
    
    # Check if order was created
    print("\n" + "-"*70)
    print("📊 RESULT CHECK")
    print("-"*70)
    
    final_count = Order.objects.count()
    print(f"Final order count: {final_count}")
    
    if final_count > initial_count:
        print(f"✅ ORDER CREATED SUCCESSFULLY!")
        new_orders = Order.objects.all().order_by('-id')[:1]
        for order in new_orders:
            print(f"\n📦 Order Details:")
            print(f"   - Order Code: {order.order_code}")
            print(f"   - Customer: {order.customer.username}")
            print(f"   - Pickup: {order.pickup_location}")
            print(f"   - Drop: {order.drop_location}")
            print(f"   - Price: Rp {order.total_price:,}")
            print(f"   - Status: {order.status}")
            print(f"   - Items: {order.items.count()}")
    else:
        print(f"❌ NO NEW ORDER CREATED")
        print("ℹ️  Check Django server logs for error details")
        print("ℹ️  Look for traceback starting with '❌ Traceback:'")

if __name__ == "__main__":
    test_order_flow()
