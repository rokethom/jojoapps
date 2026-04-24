#!/usr/bin/env python
"""
Test pricing API.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
client = APIClient()

user = User.objects.filter(role='customer').first()
if not user:
    print('No customer user found')
    sys.exit(1)

print(f'Using customer user: {user.username} (branch={user.branch.name})')
client.force_authenticate(user=user)

# Test case 1: 22 km, 1 stop
payload = {'address': 'Jakarta', 'stops': 1}
print('Payload:', payload)

response = client.post('/api/pricing/calculate/', payload, format='json')
print('Status:', response.status_code)
print('Data:', response.data)

# Test case 2: 8 km, 3 stops
payload2 = {'address': 'Surabaya', 'stops': 3}
print('Payload2:', payload2)

response2 = client.post('/api/pricing/calculate/', payload2, format='json')
print('Status2:', response2.status_code)
print('Data2:', response2.data)