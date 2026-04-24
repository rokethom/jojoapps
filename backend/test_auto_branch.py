#!/usr/bin/env python
"""
Test script untuk auto-branch assignment based on location
Run: python test_auto_branch.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from branch.models import Branch
from users.location_utils import detect_branch_by_location, calculate_distance

User = get_user_model()

def test_branch_configuration():
    """Test if all branches have coordinates"""
    print("\n" + "="*70)
    print("🧪 TEST 1: BRANCH CONFIGURATION")
    print("="*70)
    
    branches = Branch.objects.all()
    if not branches:
        print("❌ No branches found in database!")
        print("ℹ️  Create branches first in admin")
        return False
    
    all_configured = True
    for branch in branches:
        if branch.latitude and branch.longitude:
            print(f"✅ {branch.name}: ({branch.latitude}, {branch.longitude})")
        else:
            print(f"❌ {branch.name}: Missing coordinates!")
            all_configured = False
    
    return all_configured


def test_distance_calculation():
    """Test Haversine distance calculation"""
    print("\n" + "="*70)
    print("🧪 TEST 2: DISTANCE CALCULATION")
    print("="*70)
    
    # Situbondo → Surabaya distance should be ~85km
    situbondo_lat, situbondo_lon = 7.1315, 114.3602
    surabaya_lat, surabaya_lon = 7.2575, 112.7521
    
    distance = calculate_distance(
        situbondo_lat, situbondo_lon,
        surabaya_lat, surabaya_lon
    )
    
    print(f"Distance Situbondo to Surabaya: {distance:.2f}km")
    print(f"Expected: ~85km")
    
    if 80 < distance < 90:
        print("✅ Distance calculation correct!")
        return True
    else:
        print("❌ Distance calculation seems off!")
        return False


def test_branch_detection():
    """Test branch detection from various locations"""
    print("\n" + "="*70)
    print("🧪 TEST 3: BRANCH DETECTION")
    print("="*70)
    
    test_locations = [
        ("Situbondo Center", 7.1315, 114.3602),
        ("Situbondo Nearby", 7.1400, 114.3500),
        ("Surabaya", 7.2575, 112.7521),
        ("Jakarta", -6.2088, 106.8456),
        ("Random Location", 5.5, 110.5),
    ]
    
    for name, lat, lon in test_locations:
        print(f"\n📍 Testing: {name} ({lat}, {lon})")
        branch = detect_branch_by_location(lat, lon)
        if branch:
            print(f"   ✅ Detected: {branch.name}")
        else:
            print(f"   ⚠️  No branch found (outside radius)")


def test_user_registration():
    """Test user registration with auto-branch assignment"""
    print("\n" + "="*70)
    print("🧪 TEST 4: USER REGISTRATION WITH AUTO-BRANCH")
    print("="*70)
    
    from users.serializers import RegisterSerializer
    from users.models import UserProfile
    
    # Test data: Situbondo location
    test_data = {
        'username': 'testuser_situbondo',
        'password': 'testpass123',
        'name': 'Test User Situbondo',
        'phone': '081234567890',
        'latitude': 7.1315,
        'longitude': 114.3602,
    }
    
    print(f"Creating user: {test_data['username']}")
    print(f"Location: ({test_data['latitude']}, {test_data['longitude']})")
    
    serializer = RegisterSerializer(data=test_data)
    if serializer.is_valid():
        user = serializer.save()
        print(f"✅ User created: {user.username}")
        print(f"   Branch: {user.branch.name if user.branch else 'Not assigned'}")
        print(f"   Role: {user.role}")
        
        # Check UserProfile
        profile = UserProfile.objects.get(user=user)
        print(f"   Profile latitude: {profile.latitude}")
        print(f"   Profile longitude: {profile.longitude}")
        
        # Cleanup
        profile.delete()
        user.delete()
        print(f"✅ Test user deleted (cleanup)")
        return True
    else:
        print(f"❌ Registration failed: {serializer.errors}")
        return False


def test_user_without_location():
    """Test user registration without location (fallback)"""
    print("\n" + "="*70)
    print("🧪 TEST 5: USER REGISTRATION WITHOUT LOCATION")
    print("="*70)
    
    from users.serializers import RegisterSerializer
    
    # Test data: No location
    test_data = {
        'username': 'testuser_nolocation',
        'password': 'testpass123',
        'name': 'Test User No Location',
        'phone': '081234567891',
    }
    
    print(f"Creating user without location...")
    
    serializer = RegisterSerializer(data=test_data)
    if serializer.is_valid():
        user = serializer.save()
        print(f"✅ User created: {user.username}")
        print(f"   Branch: {user.branch.name if user.branch else 'Not assigned'}")
        print(f"   (Should be default branch)")
        
        # Cleanup
        user.delete()
        print(f"✅ Test user deleted (cleanup)")
        return True
    else:
        print(f"❌ Registration failed: {serializer.errors}")
        return False


def main():
    print("\n" + "🔍"*35)
    print("AUTO-BRANCH ASSIGNMENT TEST SUITE")
    print("🔍"*35)
    
    results = []
    
    # Run tests
    results.append(("Branch Configuration", test_branch_configuration()))
    results.append(("Distance Calculation", test_distance_calculation()))
    test_branch_detection()  # This doesn't return bool
    results.append(("User Registration with Location", test_user_registration()))
    results.append(("User Registration without Location", test_user_without_location()))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check configuration.")
    
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
