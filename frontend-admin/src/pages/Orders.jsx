import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  FiBox, FiSearch, FiChevronDown, FiChevronUp,
  FiTruck, FiUser, FiMapPin, FiDollarSign, FiClock, FiX,
  FiRefreshCw, FiCheckCircle,
} from "react-icons/fi";

const STATUS_LIST = ["all", "pending", "assigned", "on_delivery", "done", "cancelled"];

const STATUS_CONFIG = {
  pending:     { label: "Pending" },
  assigned:    { label: "Assigned" },
  on_delivery: { label: "On Delivery" },
  done:        { label: "Done" },
  cancelled:   { label: "Cancelled" },
};

/* Map status to badge CSS variable keys */
function getStatusBadge(status) {
  const map = {
    pending:     { bg: "var(--badge-pending-bg)",   color: "var(--badge-pending-color)" },
    assigned:    { bg: "var(--badge-assigned-bg)",   color: "var(--badge-assigned-color)" },
    on_delivery: { bg: "var(--badge-delivery-bg)",   color: "var(--badge-delivery-color)" },
    done:        { bg: "var(--badge-done-bg)",       color: "var(--badge-done-color)" },
    cancelled:   { bg: "var(--badge-cancelled-bg)",  color: "var(--badge-cancelled-color)" },
  };
  return map[status] || map.done;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editPriceModal, setEditPriceModal] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({ final_price: "" });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("orders/");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ---- Assign Driver ---- */
  const handleAssignDriver = async (orderId) => {
    const driverId = prompt("Masukkan Driver ID:");
    if (!driverId) return;
    setActionLoading(orderId);
    try {
      await api.post(`orders/${orderId}/assign_driver/`, { driver_id: driverId });
      fetchOrders();
    } catch (err) {
      alert("Gagal assign driver: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Update Status ---- */
  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await api.post(`orders/${orderId}/update_status/`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Gagal update status: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Edit Price ---- */
  const handleEditPrice = (order) => {
    setEditPriceModal(order);
    setEditPriceForm({ final_price: order.final_price || order.total_price || "" });
  };

  const handleSavePrice = async () => {
    if (!editPriceModal) return;
    const price = parseFloat(editPriceForm.final_price);
    if (isNaN(price) || price < 0) {
      alert("Harga tidak valid");
      return;
    }

    setActionLoading(editPriceModal.id);
    try {
      await api.post(`orders/${editPriceModal.id}/update_price/`, { final_price: price });
      setEditPriceModal(null);
      fetchOrders();
    } catch (err) {
      alert("Gagal update harga: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Filter & Search ---- */
  const filtered = orders
    .filter((o) => (filter === "all" ? true : o.status === filter))
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (o.order_code || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.pickup_location || "").toLowerCase().includes(q) ||
        (o.drop_location || "").toLowerCase().includes(q)
      );
    });

  /* ---- Counts per status ---- */
  const counts = {};
  STATUS_LIST.forEach((s) => {
    counts[s] = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
  });

  return (
    <div className="animate-fade-in" style={pageWrap}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-heading)", letterSpacing: "-0.02em" }}>Order Management</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 15 }}>
            {orders.length} total orders
          </p>
        </div>
        <button style={refreshBtn} onClick={fetchOrders} title="Refresh">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* FILTER TABS */}
      <div style={filterRow}>
        {STATUS_LIST.map((s) => (
          <button
            key={s}
            style={{
              ...filterTab,
              ...(filter === s ? filterTabActive : {}),
            }}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}{" "}
            <span style={{
              ...countBadge,
              ...(filter === s ? countBadgeActive : {}),
            }}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div style={searchRow}>
        <div style={searchBox}>
          <FiSearch style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search by order code, customer, location..."
            style={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <FiX style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setSearch("")} />
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinner}></div>
          <style>{`@keyframes orderSpin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "var(--text-muted)" }}>Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <FiBox size={48} style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>No orders found</p>
        </div>
      ) : (
        <div style={tableCard}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["Order Code", "Customer", "Pickup", "Drop", "Total", "Driver", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onAssign={() => handleAssignDriver(order.id)}
                  onStatus={(s) => handleUpdateStatus(order.id, s)}
                  onEditPrice={() => handleEditPrice(order)}
                  busy={actionLoading === order.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT PRICE MODAL */}
      {editPriceModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, color: "var(--text-heading)" }}>Edit Order Price</h3>
              <button
                style={modalCloseBtn}
                onClick={() => setEditPriceModal(null)}
              >
                <FiX />
              </button>
            </div>

            <div style={modalBody}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Order Code:</strong> {editPriceModal.order_code}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Customer:</strong> {editPriceModal.customer_name}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Current Price:</strong> Rp {Number(editPriceModal.final_price || editPriceModal.total_price || 0).toLocaleString("id-ID")}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, color: "var(--text-primary)", fontWeight: 500 }}>
                  New Final Price (Rp)
                </label>
                <input
                  type="number"
                  style={modalInput}
                  value={editPriceForm.final_price}
                  onChange={(e) => setEditPriceForm({ final_price: e.target.value })}
                  placeholder="Enter new price"
                  min="0"
                />
              </div>

              <div style={modalActions}>
                <button
                  style={modalCancelBtn}
                  onClick={() => setEditPriceModal(null)}
                >
                  Cancel
                </button>
                <button
                  style={modalSaveBtn}
                  onClick={handleSavePrice}
                  disabled={actionLoading === editPriceModal.id}
                >
                  {actionLoading === editPriceModal.id ? "Saving..." : "Save Price"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function OrderRow({ order, expanded, onToggle, onAssign, onStatus, onEditPrice, busy }) {
  const sc = getStatusBadge(order.status);
  const scLabel = STATUS_CONFIG[order.status]?.label || "Done";
  const price = order.final_price || order.total_price || 0;

  return (
    <>
      <tr style={trStyle} onClick={onToggle}>
        <td style={td}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{order.order_code}</span>
        </td>
        <td style={td}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={avatarCircle}>
              <FiUser size={12} />
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{order.customer_name || "Unknown Customer"}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{order.customer_phone || "-"}</div>
            </div>
          </div>
        </td>
        <td style={td}>
          <span style={locationChip}><FiMapPin size={10} /> {trunc(order.pickup_location, 22)}</span>
        </td>
        <td style={td}>
          <span style={locationChip}><FiMapPin size={10} /> {trunc(order.drop_location, 22)}</span>
        </td>
        <td style={td}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Rp {Number(price).toLocaleString("id-ID")}</span>
        </td>
        <td style={td}>
          {order.driver_name ? (
            <span style={driverChip}><FiTruck size={11} /> {order.driver_name}</span>
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
          )}
        </td>
        <td style={td}>
          <span style={{ ...badgeStyle, backgroundColor: sc.bg, color: sc.color }}>
            {scLabel}
          </span>
        </td>
        <td style={td}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date(order.created_at).toLocaleDateString("id-ID", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
        </td>
        <td style={td}>
          <button
            style={expandBtn}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </td>
      </tr>

      {/* EXPANDED DETAIL */}
      {expanded && (
        <tr>
          <td colSpan={9} style={{ padding: 0 }}>
            <div style={detailWrap}>
              {/* Items */}
              <div style={detailSection}>
                <h5 style={detailTitle}>Order Items</h5>
                {order.items && order.items.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={miniTh}>Item</th>
                        <th style={miniTh}>Qty</th>
                        <th style={miniTh}>Price</th>
                        <th style={miniTh}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td style={miniTd}>{item.name}</td>
                          <td style={miniTd}>{item.qty}</td>
                          <td style={miniTd}>Rp {Number(item.price).toLocaleString("id-ID")}</td>
                          <td style={miniTd}>Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No items recorded</p>
                )}
              </div>

              {/* Actions */}
              <div style={detailSection}>
                <h5 style={detailTitle}>Quick Actions</h5>
                <div style={actionRow}>
                  <button style={actionBtnStyle("#6366f1")} onClick={onEditPrice} disabled={busy}>
                    <FiDollarSign /> Edit Price
                  </button>
                  {order.status === "pending" && (
                    <>
                      <button style={actionBtnStyle("#3b82f6")} onClick={onAssign} disabled={busy}>
                        <FiTruck /> Assign Driver
                      </button>
                      <button style={actionBtnStyle("#ef4444")} onClick={() => onStatus("cancelled")} disabled={busy}>
                        <FiX /> Cancel
                      </button>
                    </>
                  )}
                  {order.status === "assigned" && (
                    <button style={actionBtnStyle("#10b981")} onClick={() => onStatus("on_delivery")} disabled={busy}>
                      <FiTruck /> Start Delivery
                    </button>
                  )}
                  {order.status === "on_delivery" && (
                    <button style={actionBtnStyle("#10b981")} onClick={() => onStatus("done")} disabled={busy}>
                      <FiCheckCircle /> Mark Done
                    </button>
                  )}
                  {(order.status === "done" || order.status === "cancelled") && (
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No actions available</span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div style={metaRow}>
                <span><FiDollarSign size={12} /> Total: Rp {Number(order.total_price || 0).toLocaleString("id-ID")}</span>
                {order.is_price_edited && <span style={{ color: "var(--warning)" }}>💰 Price edited — Final: Rp {Number(order.final_price || 0).toLocaleString("id-ID")}</span>}
                <span><FiClock size={12} /> {new Date(order.created_at).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ---- Helpers ---- */
function trunc(str, max) {
  if (!str) return "—";
  return str.length > max ? str.substring(0, max) + "…" : str;
}

/* ================================================================
   STYLES — fully themed with CSS variables
   ================================================================ */

const pageWrap = { padding: 10 };

const header = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28,
};

const refreshBtn = {
  display: "flex", alignItems: "center", gap: 6,
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
  padding: "8px 16px", cursor: "pointer", fontWeight: 500, fontSize: 13, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

/* filters */
const filterRow = {
  display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap",
};

const filterTab = {
  padding: "8px 16px", borderRadius: 20, border: "1px solid var(--border)",
  background: "var(--bg-card)", cursor: "pointer", fontSize: 13, fontWeight: 500,
  color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6,
  transition: "all 0.15s ease",
};

const filterTabActive = {
  background: "var(--accent)", color: "#fff", borderColor: "var(--accent)",
};

const countBadge = {
  fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
  background: "var(--accent-glow)",
};

const countBadgeActive = {
  background: "rgba(255,255,255,0.2)",
};

/* search */
const searchRow = { marginBottom: 20 };

const searchBox = {
  display: "flex", alignItems: "center", gap: 10,
  background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12,
  padding: "10px 16px", maxWidth: 480,
  transition: "all 0.15s ease",
};

const searchInput = {
  border: "none", outline: "none", background: "transparent",
  flex: 1, fontSize: 14, color: "var(--text-primary)",
};

/* table */
const tableCard = {
  background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-sm)", overflowX: "auto",
  transition: "all 0.3s ease",
};

const tableStyle = { width: "100%", borderCollapse: "collapse" };

const th = {
  padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)",
  whiteSpace: "nowrap", letterSpacing: "0.05em",
};

const td = {
  padding: "14px 16px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)",
  verticalAlign: "middle",
};

const trStyle = { cursor: "pointer", transition: "background 0.1s ease" };

/* badge */
const badgeStyle = {
  padding: "4px 12px", borderRadius: 20, fontSize: 11,
  fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap",
};

/* chips */
const avatarCircle = {
  width: 28, height: 28, borderRadius: "50%", background: "var(--accent-glow)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)",
};

const locationChip = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap",
};

const driverChip = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "var(--info)", background: "rgba(59,130,246,0.1)",
  padding: "3px 8px", borderRadius: 6, fontWeight: 500,
};

const expandBtn = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-muted)", fontSize: 18, padding: 4,
};

/* detail */
const detailWrap = {
  background: "var(--bg-card-hover)", padding: "20px 28px", borderTop: "1px solid var(--border)",
};

const detailSection = { marginBottom: 18 };

const detailTitle = { margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" };

const miniTh = {
  padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
  borderBottom: "1px solid var(--border)", textAlign: "left",
};

const miniTd = {
  padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)",
};

const actionRow = { display: "flex", gap: 8, flexWrap: "wrap" };

const actionBtnStyle = (color) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 16px", borderRadius: 10, border: "none",
  background: color, color: "#fff", fontWeight: 600, fontSize: 13,
  cursor: "pointer", transition: "opacity 0.15s ease",
});

const metaRow = {
  display: "flex", gap: 24, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap",
  paddingTop: 12, borderTop: "1px solid var(--border)",
};

/* spinner */
const spinner = {
  width: 36, height: 36, border: "4px solid var(--border)",
  borderTopColor: "var(--accent)", borderRadius: "50%",
  animation: "orderSpin 0.8s linear infinite", marginBottom: 14,
};

/* empty / loading */
const loadingBox = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", height: 300, color: "var(--text-muted)",
};

const emptyBox = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", height: 300,
  background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--card-border)",
};

/* modal styles */
const modalOverlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-lg)", maxWidth: 500, width: "90%", maxHeight: "90vh", overflow: "auto",
};

const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: 24, borderBottom: "1px solid var(--border)",
};

const modalCloseBtn = {
  background: "none", border: "none", cursor: "pointer", padding: 8,
  borderRadius: 8, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

const modalBody = {
  padding: 24,
};

const modalInput = {
  width: "100%", padding: "12px 16px", borderRadius: 8,
  border: "1px solid var(--border)", backgroundColor: "var(--bg-input)",
  color: "var(--text-primary)", fontSize: 14,
  outline: "none", transition: "all 0.15s ease",
};

const modalActions = {
  display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24,
};

const modalCancelBtn = {
  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)",
  backgroundColor: "var(--bg-card)", color: "var(--text-secondary)",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
  transition: "all 0.15s ease",
};

const modalSaveBtn = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  backgroundColor: "var(--success)", color: "#fff",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
  transition: "all 0.15s ease",
};