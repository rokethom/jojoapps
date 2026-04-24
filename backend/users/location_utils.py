"""
Utility untuk mendeteksi dan assign branch berdasarkan lokasi geografis user
"""
import math
from branch.models import Branch


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) *
        math.sin(dlon / 2) ** 2
    )
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def detect_branch_by_location(latitude, longitude):
    """
    Detect branch based on user's location (latitude, longitude)
    
    Returns:
        Branch object if found within radius, else None
    
    Args:
        latitude: float
        longitude: float
    """
    LOCATION_RADIUS = 50  # km (area to search for branch)
    
    if not latitude or not longitude:
        print(f"⚠️ Invalid coordinates: lat={latitude}, lon={longitude}")
        return None
    
    try:
        branches = Branch.objects.all()
        closest_branch = None
        closest_distance = float('inf')
        
        for branch in branches:
            if not branch.latitude or not branch.longitude:
                print(f"⚠️ Branch {branch.name} has no coordinates")
                continue
            
            distance = calculate_distance(
                latitude, longitude,
                branch.latitude, branch.longitude
            )
            
            print(f"📍 Branch: {branch.name} ({branch.area}) - Distance: {distance:.2f}km")
            
            # If within radius and closer than previous
            if distance < LOCATION_RADIUS and distance < closest_distance:
                closest_distance = distance
                closest_branch = branch
        
        if closest_branch:
            print(f"✅ Location matched to branch: {closest_branch.name} (Distance: {closest_distance:.2f}km)")
            return closest_branch
        else:
            print(f"⚠️ No branch found within {LOCATION_RADIUS}km radius")
            return None
            
    except Exception as e:
        print(f"❌ Error detecting branch: {e}")
        return None


def assign_default_branch(user):
    """
    Assign a default branch to user if not already assigned
    
    Priority:
    1. Use detected branch (from registration location)
    2. If none, use first available branch
    
    Args:
        user: User object
    """
    if user.branch:
        print(f"ℹ️ User already has branch: {user.branch.name}")
        return user.branch
    
    try:
        # Get first available branch
        default_branch = Branch.objects.first()
        if default_branch:
            user.branch = default_branch
            user.save()
            print(f"✅ Assigned default branch: {default_branch.name}")
            return default_branch
        else:
            print(f"⚠️ No branches available in system")
            return None
    except Exception as e:
        print(f"❌ Error assigning branch: {e}")
        return None
