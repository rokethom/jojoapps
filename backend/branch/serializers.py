from rest_framework import serializers
from .models import Branch, GeofenceArea, LocationLog


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'area', 'latitude', 'longitude']


class GeofenceAreaSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = GeofenceArea
        fields = [
            'id', 'branch', 'branch_name', 'name', 'description',
            'center_latitude', 'center_longitude', 'radius_meters',
            'is_active', 'priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LocationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    geofence_area_name = serializers.CharField(source='geofence_area.name', read_only=True)

    class Meta:
        model = LocationLog
        fields = [
            'id', 'user', 'user_name', 'latitude', 'longitude',
            'accuracy', 'altitude', 'speed', 'heading',
            'gps_timestamp', 'is_mock_location', 'provider',
            'is_valid', 'geofence_area', 'geofence_area_name',
            'branch', 'branch_name', 'is_suspicious', 'suspicion_reason',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
