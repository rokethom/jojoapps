#!/usr/bin/env python
"""
Populate PriceSetting for dynamic pricing.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from pricing.models import PriceSetting
from branch.models import Branch

# Get all Situbondo branches
branches = Branch.objects.filter(name='Situbondo')
if not branches:
    print('No Situbondo branch found')
    sys.exit(1)

for branch in branches:
    print(f'Populating for branch: {branch.name} (id={branch.id})')
    
    # Set default lat lon if not set
    if branch.latitude is None or branch.longitude is None:
        branch.latitude = -7.7  # Situbondo approx
        branch.longitude = 114.0
        branch.save()
        print('Set branch lat/lon')
    
    # Clear existing
    PriceSetting.objects.filter(branch=branch).delete()
    
    # Create settings
    PriceSetting.objects.create(
        name="0-5 km",
        branch=branch,
        min_km=0,
        max_km=5,
        price=6000,
        is_formula=False
    )
    
    PriceSetting.objects.create(
        name="5-10 km",
        branch=branch,
        min_km=5,
        max_km=10,
        price=12000,
        is_formula=False
    )
    
    PriceSetting.objects.create(
        name=">10 km",
        branch=branch,
        min_km=10,
        max_km=None,
        price=None,
        is_formula=True,
        per_km_rate=1900,
        subtract_value=7000
    )

print('PriceSetting populated successfully')