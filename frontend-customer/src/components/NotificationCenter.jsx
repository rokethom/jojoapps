import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const NotificationCenter = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const getOrderId = (notification) => notification.data?.order_id || notification.order;
  const getDriverId = (notification) => notification.data?.driver_id;
  const getDriverName = (notification) => notification.data?.driver_name || '';
  const getChatPath = (notification) => {
    const driverId = getDriverId(notification);
    if (!driverId) return null;
    const name = encodeURIComponent(getDriverName(notification) || 'Driver');
    const orderId = getOrderId(notification);
    return `/chat/${driverId}?name=${name}${orderId ? `&order=${orderId}` : ''}`;
  };

  const handleNavigate = (path, notificationId) => {
    if (notificationId) {
      handleMarkAsRead(notificationId).catch(() => {});
    }
    onClose();
    navigate(path);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Listen for notification events
    const handleNotificationReceived = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadCountChanged = (count) => {
      setUnreadCount(count);
    };

    notificationService.on('notificationReceived', handleNotificationReceived);
    notificationService.on('unreadCountChanged', handleUnreadCountChanged);

    return () => {
      notificationService.off('notificationReceived', handleNotificationReceived);
      notificationService.off('unreadCountChanged', handleUnreadCountChanged);
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.loadNotifications();
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return '#ef4444'; // Critical
      case 4: return '#f97316'; // Urgent
      case 3: return '#eab308'; // High
      case 2: return '#3b82f6'; // Normal
      default: return '#6b7280'; // Low
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 5: return 'Critical';
      case 4: return 'Urgent';
      case 3: return 'High';
      case 2: return 'Normal';
      default: return 'Low';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 400,
        maxHeight: 600,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationsIcon style={{ fontSize: 20, color: '#6b7280' }} />
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#111827'
          }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                color: '#3b82f6',
                fontSize: 14,
              }}
              title="Mark all as read"
            >
              <DoneAllIcon style={{ fontSize: 16 }} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              color: '#6b7280',
            }}
          >
            <CloseIcon style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxHeight: 500,
        overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}>
            <div style={{
              width: 24,
              height: 24,
              border: '2px solid #f3f4f6',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#6b7280',
          }}>
            <NotificationsIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f9fafb',
                backgroundColor: notification.is_read ? 'transparent' : '#f9fafb',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#111827',
                    marginBottom: 4,
                  }}>
                    {notification.title}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: '#4b5563',
                    lineHeight: 1.4,
                  }}>
                    {notification.message}
                  </div>
                </div>
                {!notification.is_read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getPriorityColor(notification.priority),
                    flexShrink: 0,
                    marginLeft: 8,
                  }} />
                )}
              </div>

              {getDriverName(notification) && (
                <div style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: '#6b7280',
                }}>
                  Driver: {getDriverName(notification)}
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}>
                <span style={{
                  fontSize: 11,
                  color: getPriorityColor(notification.priority),
                  backgroundColor: getPriorityColor(notification.priority) + '20',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}>
                  {getPriorityLabel(notification.priority)}
                </span>
                <span style={{
                  fontSize: 11,
                  color: '#9ca3af',
                }}>
                  {formatTime(notification.created_at)}
                </span>
              </div>
              {(getChatPath(notification) || getOrderId(notification)) && (
                <div style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  marginTop: 10,
                }}>
                  {getOrderId(notification) && (
                    <button
                      onClick={() => handleNavigate('/history', notification.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: '1px solid #0ea5e9',
                        background: 'rgba(14, 165, 233, 0.08)',
                        color: '#0ea5e9',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Lihat History
                    </button>
                  )}
                  {getChatPath(notification) && (
                    <button
                      onClick={() => handleNavigate(getChatPath(notification), notification.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: '1px solid #16a34a',
                        background: 'rgba(16, 163, 127, 0.12)',
                        color: '#16a34a',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Hubungi Driver
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f3f4f6',
          textAlign: 'center',
        }}>
          <button
            onClick={loadNotifications}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Refresh Notifications
          </button>
        </div>
      )}
    </div>
  );
};

const styles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default NotificationCenter;