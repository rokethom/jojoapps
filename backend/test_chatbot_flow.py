#!/usr/bin/env python
"""
Test chatbot flow for order creation with confirmation.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from chatbot.services.chat_engine import process_message
from orders.models import Order

User = get_user_model()
user = User.objects.filter(role='customer').first()
if not user:
    print('No customer user found')
    sys.exit(1)

print(f'Using customer: {user.username} (id={user.id}) branch={user.branch}')

messages = ['ojek', 'Jl. Gatot Subroto', 'Jl. Sudirman 123', '1', 'ya']
for i, msg in enumerate(messages, 1):
    print('\n--- Message', i, msg)
    resp = process_message(user, msg)
    print('Bot:', resp)

print('\nOrders count:', Order.objects.count())
print('Last order:', Order.objects.order_by('-id').first())
