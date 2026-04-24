from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.utils import has_role
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from django.db import models
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
        response_data["oper_handle_count"] = getattr(user, 'oper_handle_count', 0)
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
        print(f"✅ User created: {user.username}")

        # Create UserProfile
        UserProfile.objects.create(
            user=user,
            name=user.first_name or user.username,
            phone=user.phone
        )

        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            }
        }, status=status.HTTP_201_CREATED)
    else:
        print(f"❌ Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def user_list(request):
    role = request.GET.get('role', 'all')
    search = request.GET.get('search', '')
    suspended = request.GET.get('suspended', '')

    users = User.objects.all()

    if role != 'all':
        users = users.filter(role=role)

    if search:
        users = users.filter(
            models.Q(username__icontains=search) |
            models.Q(first_name__icontains=search) |
            models.Q(email__icontains=search) |
            models.Q(phone__icontains=search)
        )

    if suspended == 'true':
        users = users.filter(is_suspended=True)
    elif suspended == 'false':
        users = users.filter(is_suspended=False)

    data = []
    for u in users:
        user_data = {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "name": u.first_name or u.username,
            "role": u.role,
            "phone": u.phone,
            "is_active": u.is_active,
            "date_joined": u.date_joined,
            "is_suspended": u.is_suspended,
            "suspension_reason": u.suspension_reason,
            "suspended_until": u.suspended_until,
            "oper_handle_count": getattr(u, 'oper_handle_count', 0),
        }

        # Add branch info if exists
        if u.branch:
            user_data["branch_name"] = u.branch.name
            user_data["branch"] = {
                "id": u.branch.id,
                "name": u.branch.name,
                "area": u.branch.area,
            }

        data.append(user_data)

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


# Google OAuth2 Views
import requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth2_login(request):
    """
    Handle Google OAuth2 login/register
    Expects: { "access_token": "google_access_token" }
    """
    access_token = request.data.get('access_token')
    if not access_token:
        return Response({'error': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Verify Google access token
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        if google_response.status_code != 200:
            return Response({'error': 'Invalid Google access token'}, status=status.HTTP_400_BAD_REQUEST)

        google_user_data = google_response.json()

        # Extract user info
        google_id = google_user_data.get('id')
        email = google_user_data.get('email')
        name = google_user_data.get('name')
        picture = google_user_data.get('picture')

        if not email:
            return Response({'error': 'Email is required from Google'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        user = User.objects.filter(email=email).first()

        if user:
            # User exists, login
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': user.first_name or user.username,
                    'role': user.role,
                }
            })
        else:
            # User doesn't exist, create new user
            username = email.split('@')[0]  # Use email prefix as username
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create(
                username=username,
                email=email,
                first_name=name,
                role='customer',  # Default role for Google signups
                is_active=True
            )

            # Create UserProfile
            UserProfile.objects.create(
                user=user,
                name=name,
                phone=''  # Will be filled later
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Registration successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': user.first_name or user.username,
                    'role': user.role,
                }
            }, status=status.HTTP_201_CREATED)

    except requests.RequestException as e:
        return Response({'error': f'Google API error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)