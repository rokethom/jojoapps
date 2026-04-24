export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2001,
        width: "calc(100% - 40px)",
        maxWidth: 420,
        background: "#111827",
        color: "#fff",
        padding: 16,
        borderRadius: 16,
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
            {notification.title || "📣 Notifikasi"}
          </div>
          <div style={{ fontSize: 13, color: "#d1d5db" }}>{notification.message}</div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
