from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Branch(models.Model):
    name = models.CharField(max_length=100)
    area = models.CharField(max_length=100)

    # 🔥 TITIK NOL (ALUN-ALUN)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.area}"


class GeofenceArea(models.Model):
    """Multi-area geofencing per cabang"""
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='geofence_areas')
    name = models.CharField(max_length=100, help_text="Nama area (contoh: Pusat Kota, Terminal, dll)")
    description = models.TextField(blank=True, help_text="Deskripsi area")

    # Koordinat pusat area
    center_latitude = models.FloatField(help_text="Latitude pusat area")
    center_longitude = models.FloatField(help_text="Longitude pusat area")

    # Radius dalam meter
    radius_meters = models.PositiveIntegerField(default=1000, help_text="Radius area dalam meter")

    # Status aktif/nonaktif
    is_active = models.BooleanField(default=True)

    # Prioritas area (untuk overlapping areas)
    priority = models.PositiveIntegerField(default=1, help_text="Prioritas area (lebih tinggi = lebih prioritas)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'name']
        unique_together = ['branch', 'name']

    def __str__(self):
        return f"{self.branch.name} - {self.name} (Radius: {self.radius_meters}m)"

    def contains_point(self, latitude, longitude):
        """Check if a point is within this geofence area"""
        from math import radians, sin, cos, sqrt, atan2

        # Haversine formula untuk menghitung jarak
        R = 6371000  # Radius bumi dalam meter

        lat1_rad = radians(self.center_latitude)
        lon1_rad = radians(self.center_longitude)
        lat2_rad = radians(latitude)
        lon2_rad = radians(longitude)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))

        distance = R * c
        return distance <= self.radius_meters


class LocationLog(models.Model):
    """Log lokasi untuk anti-fake GPS dan tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='location_logs')
    latitude = models.FloatField()
    longitude = models.FloatField()
    accuracy = models.FloatField(null=True, blank=True, help_text="GPS accuracy dalam meter")
    altitude = models.FloatField(null=True, blank=True)
    speed = models.FloatField(null=True, blank=True, help_text="Kecepatan dalam m/s")
    heading = models.FloatField(null=True, blank=True, help_text="Heading/direction dalam degrees")

    # GPS metadata untuk anti-fake detection
    gps_timestamp = models.DateTimeField(null=True, blank=True, help_text="Timestamp dari GPS device")
    is_mock_location = models.BooleanField(default=False, help_text="Apakah lokasi ini mock/fake")
    provider = models.CharField(max_length=50, null=True, blank=True, help_text="GPS provider (gps, network, fused)")

    # Validation results
    is_valid = models.BooleanField(default=True, help_text="Apakah lokasi valid berdasarkan geofencing")
    geofence_area = models.ForeignKey(GeofenceArea, null=True, blank=True, on_delete=models.SET_NULL)
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL)

    # Suspicious activity flags
    is_suspicious = models.BooleanField(default=False)
    suspicion_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_valid', 'is_suspicious']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"{self.user.username} - ({self.latitude}, {self.longitude}) - {self.created_at}"

    def detect_fake_gps(self):
        """Deteksi fake GPS berdasarkan berbagai indikator"""
        reasons = []

        # 1. Check GPS timestamp vs server timestamp
        if self.gps_timestamp:
            time_diff = abs((self.created_at - self.gps_timestamp).total_seconds())
            if time_diff > 300:  # 5 menit difference
                reasons.append(f"GPS timestamp difference: {time_diff}s")

        # 2. Check accuracy (terlalu akurat = suspicious)
        if self.accuracy and self.accuracy < 1:  # Kurang dari 1 meter accuracy
            reasons.append(f"Suspicious accuracy: {self.accuracy}m")

        # 3. Check speed (terlalu cepat untuk manusia)
        if self.speed and self.speed > 50:  # Lebih dari 180 km/h
            reasons.append(f"Impossible speed: {self.speed} m/s")

        # 4. Check altitude changes (terlalu drastis)
        # Compare with previous location
        prev_location = LocationLog.objects.filter(
            user=self.user,
            created_at__lt=self.created_at
        ).order_by('-created_at').first()

        if prev_location:
            from math import radians, sin, cos, sqrt, atan2

            # Calculate distance
            R = 6371000
            lat1_rad = radians(prev_location.latitude)
            lon1_rad = radians(prev_location.longitude)
            lat2_rad = radians(self.latitude)
            lon2_rad = radians(self.longitude)

            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad

            a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c

            # Calculate time difference
            time_diff = (self.created_at - prev_location.created_at).total_seconds()

            if time_diff > 0:
                speed_calc = distance / time_diff  # m/s
                if speed_calc > 50:  # Lebih dari 180 km/h
                    reasons.append(f"Calculated impossible speed: {speed_calc} m/s")

        self.is_suspicious = len(reasons) > 0
        self.suspicion_reason = "; ".join(reasons) if reasons else ""

        return self.is_suspicious