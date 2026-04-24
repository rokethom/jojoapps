#!/usr/bin/env python
"""
Test chatbot API endpoint /api/chatbot/ to reproduce errors.
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

print(f'Using customer user: {user.username} (id={user.id})')
client.force_authenticate(user=user)

payload = {'message': 'halo'}
print('Payload:', payload)

response = client.post('/api/chatbot/', payload, format='json')
print('Status:', response.status_code)
print('Data:', getattr(response, 'data', None))
print('Content:', response.content)
