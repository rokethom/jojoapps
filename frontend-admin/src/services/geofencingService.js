// Geofencing and Location Services
class GeofencingService {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.geofenceAreas = [];
    this.isWatching = false;
  }

  // Initialize geofencing for a branch
  async initializeGeofencing(branchId) {
    try {
      const response = await api.get(`branch/geofence-areas/${branchId}/`);
      this.geofenceAreas = response.data.geofence_areas || [];
      console.log(`Loaded ${this.geofenceAreas.length} geofence areas`);
      return this.geofenceAreas;
    } catch (error) {
      console.error('Failed to load geofence areas:', error);
      throw error;
    }
  }

  // Start location tracking
  async startLocationTracking(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      updateInterval: 30000, // Update every 30 seconds
    };

    const trackingOptions = { ...defaultOptions, ...options };

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await this.handlePositionUpdate(position);
          resolve(position);

          // Start watching position
          this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handlePositionError(error),
            trackingOptions
          );

          this.isWatching = true;
        },
        (error) => {
          reject(this.handlePositionError(error));
        },
        trackingOptions
      );
    });
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
      console.log('Location tracking stopped');
    }
  }

  // Handle position updates
  async handlePositionUpdate(position) {
    const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;

    this.currentPosition = {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp: position.timestamp,
    };

    try {
      // Validate location with backend
      const validationResponse = await api.post('branch/validate-location/', {
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        gps_timestamp: new Date(position.timestamp).toISOString(),
        provider: 'browser',
      });

      const validation = validationResponse.data;

      // Dispatch custom event for location updates
      const locationEvent = new CustomEvent('locationUpdate', {
        detail: {
          position: this.currentPosition,
          validation,
          geofenceAreas: this.geofenceAreas,
        }
      });

      window.dispatchEvent(locationEvent);

      // Handle geofence alerts
      if (!validation.is_valid) {
        this.handleGeofenceViolation(validation);
      }

      // Handle suspicious location alerts
      if (validation.is_suspicious) {
        this.handleSuspiciousLocation(validation);
      }

    } catch (error) {
      console.error('Failed to validate location:', error);

      // Still dispatch event with basic position data
      const locationEvent = new CustomEvent('locationUpdate', {
        detail: {
          position: this.currentPosition,
          error: error.message,
        }
      });

      window.dispatchEvent(locationEvent);
    }
  }

  // Handle geolocation errors
  handlePositionError(error) {
    let errorMessage = 'Unknown location error';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    console.error('Geolocation error:', errorMessage);

    const errorEvent = new CustomEvent('locationError', {
      detail: { error: errorMessage, code: error.code }
    });

    window.dispatchEvent(errorEvent);
    return new Error(errorMessage);
  }

  // Handle geofence violations
  handleGeofenceViolation(validation) {
    console.warn('Geofence violation detected:', validation);

    const alertEvent = new CustomEvent('geofenceAlert', {
      detail: {
        type: 'violation',
        message: 'You are outside the designated service area',
        validation,
      }
    });

    window.dispatchEvent(alertEvent);

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Geofence Alert', {
        body: 'You are outside the designated service area',
        icon: '/favicon.ico',
      });
    }
  }

  // Handle suspicious location detection
  handleSuspiciousLocation(validation) {
    console.warn('Suspicious location detected:', validation);

    const alertEvent = new CustomEvent('suspiciousLocationAlert', {
      detail: {
        type: 'suspicious',
        message: validation.suspicion_reason || 'Suspicious location activity detected',
        validation,
      }
    });

    window.dispatchEvent(alertEvent);

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Location Alert', {
        body: 'Suspicious location activity detected',
        icon: '/favicon.ico',
      });
    }
  }

  // Check if current position is within any geofence
  isWithinGeofence(latitude, longitude) {
    return this.geofenceAreas.some(area => {
      return this.isPointInGeofence(latitude, longitude, area);
    });
  }

  // Check if point is within a specific geofence (Haversine formula)
  isPointInGeofence(latitude, longitude, geofence) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (latitude - geofence.center_latitude) * Math.PI / 180;
    const dLon = (longitude - geofence.center_longitude) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(geofence.center_latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= geofence.radius_meters;
  }

  // Get current position
  getCurrentPosition() {
    return this.currentPosition;
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Create singleton instance
const geofencingService = new GeofencingService();

export default geofencingService;