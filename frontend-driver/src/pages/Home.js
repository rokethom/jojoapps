import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../components/NotificationCenter";
import notificationService from "../services/notificationService";

export default function Home() {
  const [user, setUser] = useState(null);
  const [autoAccept, setAutoAccept] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats] = useState({
    active_orders: 0,
    completed_today: 0,
    total_earnings: 0,
  });
  const nav = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/auth/me/");
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
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
  }, []);

  const handleAutoAccept = () => {
    setAutoAccept(!autoAccept);
    localStorage.setItem('autoAccept', JSON.stringify(!autoAccept));
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    nav("/login");
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100vh",
      background: "#f5f7fb",
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}>
        <h2 style={{ margin: 0 }}>👋 {user?.name || "Driver"}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* NOTIFICATIONS */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "#fff",
                cursor: "pointer",
                position: "relative",
              }}
              title="Notifications"
            >
              <span style={{ fontSize: 20, color: "#666" }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #f5f7fb",
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: 8,
              borderRadius: 8,
              border: "none",
              background: "#ff6b6b",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{
          background: "#fff",
          padding: 15,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
          <div style={{ fontSize: 12, color: "#666" }}>Order Aktif</div>
          <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 8 }}>
            {stats.active_orders}
          </div>
        </div>

        <div style={{
          background: "#fff",
          padding: 15,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
          <div style={{ fontSize: 12, color: "#666" }}>Selesai Hari Ini</div>
          <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 8 }}>
            {stats.completed_today}
          </div>
        </div>
      </div>

      {/* AUTO ACCEPT TOGGLE */}
      <div style={{
        background: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>Auto Accept Order</div>
          <div style={{ fontSize: 12, color: "#666" }}>Terima order otomatis (max 1)</div>
        </div>
        <button
          onClick={handleAutoAccept}
          style={{
            padding: "6px 12px",
            borderRadius: 20,
            border: "none",
            background: autoAccept ? "#10b981" : "#ddd",
            color: autoAccept ? "#fff" : "#666",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {autoAccept ? "ON" : "OFF"}
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 20,
      }}>
        <button
          onClick={() => nav("/order")}
          style={{
            padding: 16,
            borderRadius: 12,
            border: "none",
            background: "#667eea",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📦 Order Baru
        </button>

        <button
          onClick={() => nav("/chat")}
          style={{
            padding: 16,
            borderRadius: 12,
            border: "none",
            background: "#764ba2",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          💬 Chat Support
        </button>
      </div>

      {/* PROFILE INFO */}
      <div style={{
        background: "#fff",
        padding: 15,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Info Profil</h3>

        <div style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
          <div><strong>Username:</strong> {user?.name || "-"}</div>
          <div><strong>Telepon:</strong> {user?.phone || "-"}</div>
          <div><strong>Role:</strong> {user?.role || "-"}</div>
          
          {/* SUSPENSION STATUS */}
          {user?.is_suspended && (
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
            }}>
              <div style={{ color: "#dc2626", fontWeight: "bold", marginBottom: 4 }}>
                ⚠️ Status: Suspended
              </div>
              <div style={{ color: "#991b1b", fontSize: 12 }}>
                {user?.suspension_reason || "Akun suspended"}
              </div>
            </div>
          )}

          {/* SETTLEMENT STATUS */}
          {user?.settlement_status && (
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: user?.settlement_status?.status === 'overdue' ? '#fef3c7' : '#dcfce7',
              border: user?.settlement_status?.status === 'overdue' ? '1px solid #fcd34d' : '1px solid #86efac',
              borderRadius: 8,
            }}>
              <div style={{
                color: user?.settlement_status?.status === 'overdue' ? '#b45309' : '#065f46',
                fontWeight: "bold",
                marginBottom: 4,
              }}>
                📊 Settlement: {user?.settlement_status?.status === 'paid' ? '✅ Dibayar' : user?.settlement_status?.status === 'pending' ? '⏳ Menunggu' : '⚠️ Overdue'}
              </div>
              <div style={{
                color: user?.settlement_status?.status === 'overdue' ? '#92400e' : '#166534',
                fontSize: 12,
              }}>
                Period: {user?.settlement_status?.period}<br/>
                Tanggal: {user?.settlement_status?.period_start} s/d {user?.settlement_status?.period_end}<br/>
                Amount: Rp {user?.settlement_status?.settlement_amount?.toLocaleString('id-ID') || '-'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
}
