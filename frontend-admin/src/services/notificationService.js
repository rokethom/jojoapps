// Notification Service for FCM and Real-time Updates
import api from "../api/axios";

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

      // Attempt to connect websocket for real-time notifications
      try {
        const meRes = await api.get('/auth/me/');
        const me = meRes.data;
        if (me) {
          this.connectWebSocket(me.id, me.role || 'admin');
        }
      } catch (e) {
        // ignore
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

      const response = await api.post('notifications/device-tokens/register/', {
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
      const response = await api.get('notifications/notifications/');
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
      const response = await api.get('notifications/notifications/unread_count/');
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
      await api.post(`notifications/notifications/${notificationId}/mark_read/`);
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
      await api.post('notifications/notifications/mark_all_read/');
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
      const response = await api.post('notifications/test-notification/', {
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
        tag: `notification-${notification.id}`,
        requireInteraction: notification.priority >= 4,
      });

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds for low priority
      if (notification.priority <= 2) {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }

  // Event system
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

  // WebSocket integration for real-time updates
  connectWebSocket(userId, userType = 'driver') {
    // This would connect to your WebSocket endpoint
    // Implementation depends on your WebSocket setup
    console.log(`Connecting WebSocket for ${userType} ${userId}`);

    const token = localStorage.getItem('access');
    if (!token) {
      console.warn('Notification websocket not created because no access token is available.');
      return;
    }

    try {
      const baseUrl = window.location.origin || (window.location.protocol + '//' + window.location.hostname + ':8000');
      const socketUrl = baseUrl.replace(/^http/, 'ws') + `/ws/chat?token=${encodeURIComponent(token)}`;
      console.log('Connecting notification websocket:', socketUrl);
      this.ws = new WebSocket(socketUrl);

      this.ws.onopen = () => console.log('Notification websocket connected');
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          // Only handle high-level notifications here (chat_message, order_notification)
          if (data?.type === 'chat_message' || data?.type === 'order_notification') {
            const title = data.type === 'order_notification' ? 'Order Update' : 'Pesan Baru';
            const body = data.message || data.detail || '';
            this.handleIncomingNotification({ title, body, notification_type: data.type, priority: 2, data });
          }
        } catch (err) {
          console.error('Failed to parse notification WS message', err);
        }
      };
      this.ws.onclose = () => console.warn('Notification websocket closed');
      this.ws.onerror = (err) => console.error('Notification websocket error', err);
    } catch (e) {
      console.error('Failed to connect notification websocket', e);
      this.mockWebSocketConnection();
    }
  }

  mockWebSocketConnection() {
    // Simulate receiving notifications via WebSocket
    setInterval(() => {
      // Randomly simulate incoming notifications (for testing)
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        this.handleIncomingNotification({
          title: 'Mock Real-time Notification',
          body: 'This is a simulated real-time notification',
          notification_type: 'system_alert',
          priority: 2,
        });
      }
    }, 30000);
  }

  // Cleanup
  destroy() {
    this.eventListeners = {};
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;