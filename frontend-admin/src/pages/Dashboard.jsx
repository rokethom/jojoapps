import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  FiBox, FiClock, FiTruck, FiUsers, FiArrowRight,
  FiTrendingUp, FiMapPin, FiRefreshCw, FiMessageSquare, FiCheck, FiX,
  FiShield,
} from "react-icons/fi";

export default function Dashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    total_order: 0, pending: 0, on_delivery: 0, driver_online: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const wsRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("dashboard/stats/");
        setStats(res.data);
      } catch {
        try {
          const res = await api.get("dashboard/");
          setStats({
            total_order: res.data.total_orders || 0,
            pending: res.data.pending_orders || 0,
            on_delivery: 0,
            driver_online: res.data.drivers_online || 0,
          });
        } catch (e) { console.error("Stats fetch failed", e); }
      }
      try {
        const res = await api.get("orders/");
        setRecentOrders((Array.isArray(res.data) ? res.data : []).slice(0, 6));
      } catch (e) { console.error("Orders fetch failed", e); }
      try {
        const res = await api.get("chat/history/");
        setChatHistory(Array.isArray(res.data) ? res.data : []);
      } catch (e) { console.error("Chat history fetch failed", e); }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [showToast]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = (() => {
    const h = time.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  if (loading) {
    return (
      <div style={loaderWrap}>
        <div style={loaderSpinner}></div>
        <style>{`@keyframes dspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
      {/* HEADER */}
      <div style={headerRow}>
        <div>
          <h1 style={{ ...headingStyle, color: "var(--text-heading)" }}>{greeting} 👋</h1>
          <p style={{ ...subheadingStyle, color: "var(--text-secondary)" }}>
            Here's what's happening with your orders today.
          </p>
        </div>
        <span style={{ ...dateChip, background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          <FiClock size={13} />
          {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* STAT CARDS */}
      <div style={statsGrid}>
        <StatCard title="Total Orders" value={stats.total_order} icon={<FiBox />}
          gradient="linear-gradient(135deg, #6366f1, #818cf8)" trendText="+12%" trendUp delay={0} />
        <StatCard title="Pending" value={stats.pending} icon={<FiClock />}
          gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trendText="Needs action" delay={1} />
        <StatCard title="On Delivery" value={stats.on_delivery} icon={<FiTruck />}
          gradient="linear-gradient(135deg, #10b981, #34d399)" trendText="In progress" delay={2} />
        <StatCard title="Drivers Online" value={stats.driver_online} icon={<FiUsers />}
          gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" trendText="Active" delay={3} />
        <StatCard title="Suspended Drivers" value={stats.suspended_drivers || 0} icon={<FiShield />}
          gradient="linear-gradient(135deg, #ef4444, #f87171)" trendText="Manage" delay={4} onClick={() => nav("/admin/users?role=driver&suspended=true")} />
      </div>

      {/* BOTTOM */}
      <div style={{ ...bottomGrid, gridTemplateColumns: "1fr 1fr 360px" }}>
        {/* RECENT ORDERS */}
        <div style={{ ...tableCard, background: "var(--bg-card)", borderColor: "var(--card-border)" }} className="animate-fade-in-up delay-3">
          <div style={sectionHead}>
            <div>
              <h3 style={{ ...sectionTitle, color: "var(--text-heading)" }}>Recent Orders</h3>
              <p style={{ ...sectionSub, color: "var(--text-muted)" }}>{recentOrders.length} latest</p>
            </div>
            <button style={{ ...viewAllBtn, borderColor: "var(--border)", color: "var(--text-secondary)" }} onClick={() => nav("/admin/orders")}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Order", "Customer", "Location", "Status", "Time"].map((h) => (
                    <th key={h} style={{ ...th, color: "var(--text-muted)", borderColor: "var(--border-light)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No orders yet</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{order.order_code || `#${order.id}`}</span>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...customerAvatar, background: "var(--avatar-bg)", color: "var(--avatar-color)" }}>
                          {(order.customer_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: "var(--text-primary)" }}>{order.customer_name || "Unknown Customer"}</span>
                      </div>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                        <FiMapPin size={11} />{truncate(order.pickup_location, 20)}
                      </span>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}><StatusBadge status={order.status} /></td>
                    <td style={{ ...td, borderColor: "var(--border-light)", color: "var(--text-muted)", fontSize: 13 }}>
                      {new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CHAT HISTORY */}
        <div style={{ ...tableCard, background: "var(--bg-card)", borderColor: "var(--card-border)" }} className="animate-fade-in-up delay-4">
          <div style={sectionHead}>
            <div>
              <h3 style={{ ...sectionTitle, color: "var(--text-heading)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiMessageSquare size={18} />
                Chat History
              </h3>
              <p style={{ ...sectionSub, color: "var(--text-muted)" }}>{chatHistory.length} recent conversations</p>
            </div>
            <button style={{ ...viewAllBtn, borderColor: "var(--border)", color: "var(--text-secondary)" }} onClick={() => nav("/admin/chat")}>
              View All <FiArrowRight size={14} />
            </button>
          </div>
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Order ID", "Customer", "Driver", "Latest Message", "Time"].map((h) => (
                    <th key={h} style={{ ...th, color: "var(--text-muted)", borderColor: "var(--border-light)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chatHistory.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No chat history yet</td></tr>
                ) : chatHistory.map((chat) => (
                  <tr key={chat.room_id}>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{chat.order_code || `#${chat.order_id}`}</span>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ ...customerAvatar, background: "var(--avatar-bg)", color: "var(--avatar-color)" }}>
                          {(chat.customer_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: "var(--text-primary)", fontSize: 12 }}>{truncate(chat.customer_name, 15)}</span>
                      </div>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ ...customerAvatar, background: "var(--avatar-bg)", color: "var(--avatar-color)" }}>
                          {(chat.driver_name || "D").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: "var(--text-primary)", fontSize: 12 }}>{truncate(chat.driver_name || "Unassigned", 15)}</span>
                      </div>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>
                          {chat.latest_sender}:
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                          {truncate(chat.latest_message, 30)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {chat.message_count} messages
                        </div>
                      </div>
                    </td>
                    <td style={{ ...td, borderColor: "var(--border-light)", color: "var(--text-muted)", fontSize: 13 }}>
                      {formatTimeAgo(chat.latest_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT */}
        <div style={rightCol}>
          {/* TOAST NOTIFICATION */}
          {toast && (
            <div style={{
              ...toastStyle,
              background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {toast.type === 'success' && <FiCheck size={16} />}
                {toast.type === 'error' && <FiX size={16} />}
                {toast.type === 'info' && <FiMessageSquare size={16} />}
                <span style={{ fontSize: 13, fontWeight: 500 }}>{toast.message}</span>
              </div>
            </div>
          )}

          <div style={{ ...actionCard, background: "var(--bg-card)", borderColor: "var(--card-border)" }} className="animate-fade-in-up delay-4">
            <h3 style={{ ...sectionTitle, color: "var(--text-heading)" }}>Quick Actions</h3>
            <div style={actionsGrid}>
              <ActionTile icon={<FiBox />} label="New Order" color="#6366f1" onClick={() => nav("/admin/orders")} />
              <ActionTile icon={<FiUsers />} label="Users" color="#10b981" onClick={() => nav("/admin/users")} />
              <ActionTile icon={<FiTruck />} label="Drivers" color="#f59e0b" onClick={() => nav("/admin/users")} />
              <ActionTile icon={<FiRefreshCw />} label="Refresh" color="#3b82f6" onClick={() => window.location.reload()} />
            </div>
          </div>
            <h3 style={{ ...sectionTitle, color: "var(--text-heading)" }}>Order Distribution</h3>
            <div style={distList}>
              <DistBar label="Pending" value={stats.pending} total={stats.total_order || 1} color="#f59e0b" />
              <DistBar label="On Delivery" value={stats.on_delivery} total={stats.total_order || 1} color="#10b981" />
              <DistBar label="Completed" value={Math.max(0, stats.total_order - stats.pending - stats.on_delivery)} total={stats.total_order || 1} color="#6366f1" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

/* ================================================================ */

function StatCard({ title, value, icon, gradient, trendText, trendUp, delay, onClick }) {
  return (
    <div style={{ ...statCard, background: "var(--bg-card)", borderColor: "var(--card-border)", cursor: onClick ? "pointer" : "default" }} className={`animate-fade-in-up delay-${delay}`} onClick={onClick}>
      <div style={statTop}>
        <div style={{ ...statIconBox, background: gradient }}>{icon}</div>
        {trendUp ? (
          <span style={trendBadge}><FiTrendingUp size={12} /> {trendText}</span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{trendText}</span>
        )}
      </div>
      <div style={{ ...statValue, color: "var(--text-heading)" }}>{value}</div>
      <div style={{ ...statLabel, color: "var(--text-secondary)" }}>{title}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:     { bg: "var(--badge-pending-bg)",   color: "var(--badge-pending-color)",   label: "Pending" },
    assigned:    { bg: "var(--badge-assigned-bg)",   color: "var(--badge-assigned-color)",   label: "Assigned" },
    on_delivery: { bg: "var(--badge-delivery-bg)",   color: "var(--badge-delivery-color)",   label: "On Delivery" },
    done:        { bg: "var(--badge-done-bg)",       color: "var(--badge-done-color)",       label: "Done" },
    cancelled:   { bg: "var(--badge-cancelled-bg)",  color: "var(--badge-cancelled-color)",  label: "Cancelled" },
  };
  const s = map[status] || map.done;
  return <span style={{ ...badgeBase, background: s.bg, color: s.color }}>{s.label}</span>;
}

function ActionTile({ icon, label, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...actionTile,
        background: hovered ? `${color}18` : "var(--bg-input)",
        borderColor: hovered ? `${color}40` : "var(--border-light)",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ fontSize: 20, color }}>{icon}</div>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
    </div>
  );
}

function DistBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {value} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--dist-track)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 0.6s ease" }}></div>
      </div>
    </div>
  );
}

const chatQueueItemCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: 12,
  borderRadius: 12,
  border: '1px solid',
  transition: 'all 0.2s ease',
};

const customerBadge = {
  width: 36,
  height: 36,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  color: '#fff',
  flexShrink: 0,
};

const chatQueueActions = {
  display: 'flex',
  gap: 6,
  flexShrink: 0,
};

const chatActionBtn = {
  border: 'none',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  minWidth: 36,
  height: 36,
};

const toastStyle = {
  position: 'fixed',
  top: 20,
  right: 20,
  padding: '12px 16px',
  borderRadius: 12,
  color: '#fff',
  zIndex: 9999,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  animation: 'slideIn 0.3s ease',
};

function truncate(str, max) {
  if (!str) return "—";
  return str.length > max ? str.substring(0, max) + "…" : str;
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/* ================================================================
   STYLES
   ================================================================ */
const loaderWrap = { height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" };
const loaderSpinner = {
  width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)",
  borderRadius: "50%", animation: "dspin 0.7s linear infinite",
};

const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 };
const headingStyle = { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" };
const subheadingStyle = { fontSize: 15, marginTop: 4 };
const dateChip = {
  display: "inline-flex", alignItems: "center", gap: 6,
  border: "1px solid", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 500,
};

const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 };
const statCard = {
  borderRadius: 16, padding: "22px 24px", border: "1px solid",
  boxShadow: "var(--shadow-sm)", transition: "background 0.3s ease, border-color 0.3s ease",
};
const statTop = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const statIconBox = {
  width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
  color: "#fff", fontSize: 18,
};
const trendBadge = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.1)",
  padding: "3px 8px", borderRadius: 6,
};
const statValue = { fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 4, letterSpacing: "-0.02em" };
const statLabel = { fontSize: 14, fontWeight: 500 };

const bottomGrid = { display: "grid", gridTemplateColumns: "1fr 1fr 360px", gap: 24 };
const tableCard = {
  borderRadius: 16, border: "1px solid", boxShadow: "var(--shadow-sm)", overflow: "hidden",
  transition: "background 0.3s ease, border-color 0.3s ease",
};
const sectionHead = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px" };
const sectionTitle = { fontSize: 16, fontWeight: 600, margin: 0 };
const sectionSub = { fontSize: 13, marginTop: 2 };
const viewAllBtn = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "none", border: "1px solid", borderRadius: 8,
  padding: "7px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
const tableWrap = { overflowX: "auto" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const th = {
  padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid", whiteSpace: "nowrap",
};
const td = { padding: "14px 20px", fontSize: 14, borderBottom: "1px solid", verticalAlign: "middle" };
const customerAvatar = {
  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 12, fontWeight: 700,
};
const badgeBase = { padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" };

const rightCol = { display: "flex", flexDirection: "column", gap: 20 };
const actionCard = {
  borderRadius: 16, padding: 24, border: "1px solid",
  transition: "background 0.3s ease, border-color 0.3s ease",
};
const actionsGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 };
const actionTile = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  padding: "16px 12px", borderRadius: 12, border: "1px solid", cursor: "pointer",
  transition: "all 0.15s ease",
};
const distList = { display: "flex", flexDirection: "column", gap: 16, marginTop: 16 };

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */
