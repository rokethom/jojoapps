import React from "react";
import Chat from "../pages/Chat";

export default function ChatModal({ open, onClose, driverId, orderId }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 720,
        height: '90vh',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #2d004d 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer'
          }}>✕</button>
        </div>
        <div style={{ height: 'calc(100% - 40px)' }}>
          <Chat driverIdProp={driverId} orderProp={orderId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
