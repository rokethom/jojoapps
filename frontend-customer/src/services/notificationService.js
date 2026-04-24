// Notification Service for FCM and Real-time Updates
import API from "../api/axios";

class NotificationService {
  constructor() {
    this.deviceToken = null;
    this.isInitialized = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.eventListeners = {};
  }

  // Initialize notification service
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request notification permission
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('Notification permission denied');
      }

      // Register device token
      await this.registerDeviceToken();

      // Load existing notifications
      await this.loadNotifications();

      // Connect websocket for real-time notifications (if available)
      try {
        const meRes = await API.get('/auth/me/');
        const me = meRes.data;
        if (me && this.connectWebSocket) {
          // connectWebSocket may be defined in admin service; for customer we provide a simple connector
          if (typeof this.connectWebSocket === 'function') {
            // Some services implement connectWebSocket differently; call safely
            try {
              this.connectWebSocket(me.id, me.role || 'customer');
            } catch (e) {
              // ignore if not implemented
            }
          }
        }
      } catch (e) {
        // ignore auth/me failure
      }

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
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

  // Register device token with backend
  async registerDeviceToken(token = null) {
    try {
      // In a real implementation, you'd get FCM token here
      // For now, we'll use a mock token
      const deviceToken = token || this.generateMockToken();

      const response = await API.post('notifications/device-tokens/register/', {
        token: deviceToken,
        device_type: this.getDeviceType(),
        device_id: this.getDeviceId(),
      });

      this.deviceToken = response.data;
      console.log('Device token registered:', this.deviceToken);
      return this.deviceToken;
    } catch (error) {
      console.error('Failed to register device token:', error);
      throw error;
    }
  }

  // Generate mock FCM token (replace with real FCM implementation)
  generateMockToken() {
    return 'mock_fcm_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get device type
  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    return 'web';
  }

  // Get unique device ID
  getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  // Load notifications from backend
  async loadNotifications() {
    try {
      const response = await API.get('notifications/notifications/');
      this.notifications = response.data.results || response.data;
      this.updateUnreadCount();
      return this.notifications;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await API.get('notifications/notifications/unread_count/');
      this.unreadCount = response.data.unread_count;
      return this.unreadCount;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Update unread count
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
    this.emit('unreadCountChanged', this.unreadCount);
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await API.post(`notifications/notifications/${notificationId}/mark_read/`);
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
        this.updateUnreadCount();
      }
      this.emit('notificationRead', notification);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await API.post('notifications/notifications/mark_all_read/');
      this.notifications.forEach(n => n.is_read = true);
      this.unreadCount = 0;
      this.emit('allNotificationsRead');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Send test notification
  async sendTestNotification(title, message, type = 'system_alert') {
    try {
      const response = await API.post('notifications/test-notification/', {
        title,
        message,
        type,
      });
      console.log('Test notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Handle incoming notification (called by FCM service worker)
  handleIncomingNotification(notificationData) {
    console.log('Incoming notification:', notificationData);

    // Add to local notifications list
    const notification = {
      id: Date.now(), // Temporary ID
      title: notificationData.title,
      message: notificationData.body,
      notification_type: notificationData.notification_type,
      priority: notificationData.priority,
      is_read: false,
      created_at: new Date().toISOString(),
      data: notificationData.data || {},
    };

    this.notifications.unshift(notification);
    this.updateUnreadCount();

    // Show browser notification
    this.showBrowserNotification(notification);

    // Emit event
    this.emit('notificationReceived', notification);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: notification.priority >= 4,
        silent: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        // You could navigate to a specific page here
      };

      // Auto-close after 5 seconds for low priority notifications
      if (notification.priority <= 2) {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }

  // Event system for real-time updates
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;