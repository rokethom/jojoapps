import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .models import Branch, GeofenceArea, LocationLog
from .serializers import BranchSerializer, GeofenceAreaSerializer, LocationLogSerializer
from math import radians, sin, cos, sqrt, atan2
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class BranchListView(APIView):
    """
    API untuk mendapatkan daftar semua branch
    Endpoint: GET /api/branch/list/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Get list of all branches for registration"""
        try:
            branches = Branch.objects.all().values('id', 'name', 'area')
            
            if not branches:
                return Response(
                    {"message": "No branches available"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                "branches": list(branches),
                "count": len(branches)
            })
            
        except Exception as e:
            print(f"❌ Error fetching branches: {e}")
            return Response(
                {"error": "Failed to fetch branches"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class GeocodeView(APIView):
    def get(self, request):
        area = request.GET.get("area")

        if not area:
            return Response({"error": "Area is required"}, status=400)

        try:
            # 🔥 pakai Nominatim (gratis, OpenStreetMap)
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": area,
                "format": "json",
                "limit": 1
            }

            headers = {
                "User-Agent": "django-app"
            }

            res = requests.get(url, params=params, headers=headers)
            data = res.json()

            if not data:
                return Response({"error": "Location not found"}, status=404)

            return Response({
                "latitude": data[0]["lat"],
                "longitude": data[0]["lon"]
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class GeofenceAreaListView(APIView):
    """Get geofence areas for a branch"""
    permission_classes = [AllowAny]

    def get(self, request, branch_id=None):
        try:
            if branch_id:
                geofences = GeofenceArea.objects.filter(
                    branch_id=branch_id,
                    is_active=True
                )
            else:
                geofences = GeofenceArea.objects.filter(is_active=True)

            serializer = GeofenceAreaSerializer(geofences, many=True)
            return Response({
                'geofence_areas': serializer.data,
                'count': len(serializer.data)
            })

        except Exception as e:
            logger.error(f"Error fetching geofence areas: {e}")
            return Response(
                {"error": "Failed to fetch geofence areas"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_location(request):
    """Validate user location against geofencing rules"""
    try:
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        accuracy = request.data.get('accuracy', 0)
        altitude = request.data.get('altitude')
        speed = request.data.get('speed')
        heading = request.data.get('heading')
        gps_timestamp = request.data.get('gps_timestamp')
        provider = request.data.get('provider', 'gps')

        if not latitude or not longitude:
            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert to float
        try:
            latitude = float(latitude)
            longitude = float(longitude)
            accuracy = float(accuracy) if accuracy else None
            altitude = float(altitude) if altitude else None
            speed = float(speed) if speed else None
            heading = float(heading) if heading else None
        except ValueError:
            return Response(
                {"error": "Invalid coordinate values"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's branch
        user_branch = getattr(request.user, 'branch', None)
        if not user_branch:
            return Response(
                {"error": "User not assigned to any branch"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find geofence areas for user's branch
        geofence_areas = GeofenceArea.objects.filter(
            branch=user_branch,
            is_active=True
        ).order_by('-priority')

        # Check if location is within any geofence area
        valid_geofence = None
        is_valid = False

        for geofence in geofence_areas:
            if geofence.contains_point(latitude, longitude):
                valid_geofence = geofence
                is_valid = True
                break

        # Create location log
        location_log = LocationLog.objects.create(
            user=request.user,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            altitude=altitude,
            speed=speed,
            heading=heading,
            gps_timestamp=gps_timestamp,
            provider=provider,
            is_valid=is_valid,
            geofence_area=valid_geofence,
            branch=user_branch
        )

        # Detect fake GPS
        is_suspicious = location_log.detect_fake_gps()
        location_log.is_suspicious = is_suspicious
        location_log.save()

        # Send alert if suspicious location detected
        if is_suspicious:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=request.user,
                title="Suspicious Location Detected",
                message=f"Your location appears suspicious: {location_log.suspicion_reason}",
                notification_type="location_suspicious",
                priority=4,  # Urgent
                branch=user_branch,
                data={
                    'latitude': latitude,
                    'longitude': longitude,
                    'suspicion_reason': location_log.suspicion_reason,
                }
            ).send_push_notification()

        response_data = {
            'is_valid': is_valid,
            'geofence_area': GeofenceAreaSerializer(valid_geofence).data if valid_geofence else None,
            'branch': {
                'id': user_branch.id,
                'name': user_branch.name,
                'area': user_branch.area,
            },
            'is_suspicious': is_suspicious,
            'suspicion_reason': location_log.suspicion_reason if is_suspicious else None,
            'location_log_id': location_log.id,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error validating location: {e}")
        return Response(
            {"error": "Failed to validate location"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_location_history(request):
    """Get user's location history"""
    try:
        limit = int(request.GET.get('limit', 50))
        hours = int(request.GET.get('hours', 24))

        from django.utils import timezone
        from datetime import timedelta

        since = timezone.now() - timedelta(hours=hours)

        locations = LocationLog.objects.filter(
            user=request.user,
            created_at__gte=since
        ).order_by('-created_at')[:limit]

        serializer = LocationLogSerializer(locations, many=True)
        return Response({
            'locations': serializer.data,
            'count': len(serializer.data)
        })

    except Exception as e:
        logger.error(f"Error fetching location history: {e}")
        return Response(
            {"error": "Failed to fetch location history"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
