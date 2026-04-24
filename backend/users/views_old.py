from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.utils import has_role
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from .serializers import RegisterSerializer
from .models import User, UserProfile, FavoriteLocation
from .permissions import IsAdmin


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    if request.method == 'PATCH':
        name = request.data.get('name')
        phone = request.data.get('phone')
        address = request.data.get('address')

        if name:
            user.first_name = name
        if phone:
            user.phone = phone
        user.save()

        from .models import UserProfile
        profile = getattr(user, 'userprofile', None)
        if not profile:
            profile = UserProfile.objects.create(user=user, name=user.first_name or user.username, phone=user.phone)

        if address is not None:
            profile.address = address
        profile.save()

    address = None
    if hasattr(user, 'userprofile'):
        address = user.userprofile.address

    branch = None
    if user.branch:
        branch = {
            "id": user.branch.id,
            "name": user.branch.name,
            "area": user.branch.area,
        }

    # Get latest settlement status for driver
    settlement_status = None
    if user.role == 'driver':
        from settlement.models import DriverSettlement
        latest_settlement = DriverSettlement.objects.filter(driver=user).order_by('-period_end').first()
        if latest_settlement:
            settlement_status = {
                'status': latest_settlement.status,
                'period': latest_settlement.get_period_display(),
                'period_start': str(latest_settlement.period_start),
                'period_end': str(latest_settlement.period_end),
                'settlement_amount': float(latest_settlement.settlement_amount),
            }

    response_data = {
        "id": user.id,
        "name": user.first_name or user.username,
        "role": user.role,
        "phone": user.phone,
        "address": address,
        "branch": branch,
    }

    # Add settlement and suspension info for drivers
    if user.role == 'driver':
        response_data["is_suspended"] = user.is_suspended
        response_data["suspension_reason"] = user.suspension_reason
        response_data["suspended_until"] = user.suspended_until
        response_data["oper_handle_count"] = user.oper_handle_count
        response_data["settlement_status"] = settlement_status

    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    print(f"\n📥 Register request received")
    print(f"   Data: {request.data}")
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        print(f"✅ Serializer is valid")
        user = serializer.save()
        return Response({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "name": user.first_name,
                "email": user.email,
                "phone": user.phone,
                "branch": {
                    "id": user.branch.id if user.branch else None,
                    "name": user.branch.name if user.branch else None,
                    "area": user.branch.area if user.branch else None,
                } if user.branch else None
            }
        }, status=status.HTTP_201_CREATED)
    
    print(f"❌ Serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def user_list(request):
    """List all users for admin dashboard"""
    users = User.objects.all().order_by('-date_joined')
    data = []
    for u in users:
        address = None
        if hasattr(u, 'userprofile') and u.userprofile:
            address = u.userprofile.address

        branch_data = None
        if u.branch:
            branch_data = {
                "id": u.branch.id,
                "name": u.branch.name,
                "area": u.branch.area,
            }

        data.append({
            "id": u.id,
            "username": u.username,
            "name": u.first_name or u.username,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "branch": branch_data,
            "branch_name": u.branch.name if u.branch else None,
            "address": address,
            "date_joined": u.date_joined,
            "is_suspended": u.is_suspended,
            "suspension_reason": u.suspension_reason,
            "suspended_until": u.suspended_until,
            "oper_handle_count": getattr(u, 'oper_handle_count', 0),
        })

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def unsuspend_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.is_suspended = False
    user.suspension_reason = ''
    user.suspended_until = None
    user.oper_handle_count = 0
    user.save(update_fields=['is_suspended', 'suspension_reason', 'suspended_until', 'oper_handle_count'])

    return Response({'status': 'unsuspended'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def suspend_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    duration_hours = request.data.get('duration_hours')
    reason = request.data.get('reason', 'Suspended by admin')

    if not duration_hours:
        return Response({'detail': 'duration_hours is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        duration_hours = int(duration_hours)
        if duration_hours <= 0:
            return Response({'detail': 'duration_hours must be positive.'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'detail': 'duration_hours must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

    user.is_suspended = True
    user.suspension_reason = reason
    user.suspended_until = timezone.now() + timedelta(hours=duration_hours)
    user.save(update_fields=['is_suspended', 'suspension_reason', 'suspended_until'])

    return Response({
        'status': 'suspended',
        'suspended_until': user.suspended_until,
        'suspension_reason': user.suspension_reason
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def favorite_locations(request):
    user = request.user

    if request.method == 'GET':
        favorites = FavoriteLocation.objects.filter(user=user).order_by('-created_at')
        data = [
            {
                'id': fav.id,
                'address': fav.address,
                'lat': fav.latitude,
                'lng': fav.longitude,
            }
            for fav in favorites
        ]
        return Response(data)

    elif request.method == 'POST':
        address = request.data.get('address')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if not all([address, lat, lng]):
            return Response({'error': 'Address, lat, and lng are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            favorite = FavoriteLocation.objects.create(
                user=user,
                address=address,
                latitude=float(lat),
                longitude=float(lng)
            )
            return Response({
                'id': favorite.id,
                'address': favorite.address,
                'lat': favorite.latitude,
                'lng': favorite.longitude,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)