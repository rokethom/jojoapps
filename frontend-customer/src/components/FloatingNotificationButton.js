import React, { useState, useEffect } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuthStore } from '../store/useAuthStore';
import NotificationCenter from './NotificationCenter';
import notificationService from '../services/notificationService';

const FloatingNotificationButton = () => {
  const { token } = useAuthStore();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      // Initialize notification service
      const initNotifications = async () => {
        try {
          await notificationService.initialize();
          const count = await notificationService.getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
        }
      };

      initNotifications();

      // Listen for notification events
      const handleUnreadCountChanged = (count) => {
        setUnreadCount(count);
      };

      notificationService.on('unreadCountChanged', handleUnreadCountChanged);

      return () => {
        notificationService.off('unreadCountChanged', handleUnreadCountChanged);
      };
    }
  }, [token]);

  if (!token) return null; // Only show for logged-in users

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        onClick={() => setNotificationOpen(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        }}
      >
        <div style={{ position: 'relative' }}>
          <NotificationsIcon
            style={{
              fontSize: 28,
              color: 'white',
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
            }}
          />
          {unreadCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#ff4757',
                color: 'white',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 'bold',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                animation: 'pulse 2s infinite',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default FloatingNotificationButton;