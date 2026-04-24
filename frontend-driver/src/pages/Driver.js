import { useEffect, useState } from "react";
import API from "../api/axios";

const googleMapsUrl = (lat, lng) => {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "#f59e0b";
    case "assigned":
      return "#3b82f6";
    case "on_delivery":
      return "#0ea5e9";
    case "done":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

export default function Driver() {
  const [activeTab, setActiveTab] = useState("history");
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders/history/");
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get("/driver/request-order/");
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    setSubmitting(true);
    try {
      await API.post("/driver/request-order/", formData);
      setFormData({ text: "" });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100vh",
      background: "#f5f7fb",
      paddingBottom: 100,
    }}>
      {/* TABS */}
      <div style={{
        display: "flex",
        marginBottom: 20,
        background: "#fff",
        borderRadius: 12,
        padding: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            borderRadius: 8,
            background: activeTab === "history" ? "#10b981" : "transparent",
            color: activeTab === "history" ? "#fff" : "#666",
            fontWeight: activeTab === "history" ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          📋 Order Saya
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            borderRadius: 8,
            background: activeTab === "requests" ? "#10b981" : "transparent",
            color: activeTab === "requests" ? "#fff" : "#666",
            fontWeight: activeTab === "requests" ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          📝 Request Order
        </button>
      </div>

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <>
          <h2 style={{ marginBottom: 15 }}>📋 Riwayat Order</h2>

          {loading ? (
            <div style={{ color: "#666", textAlign: "center" }}>Memuat riwayat...</div>
          ) : orders.length === 0 ? (
            <div style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              color: "#666",
            }}>
              Belum ada riwayat order
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                style={{
                  background: "#fff",
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  borderLeft: `4px solid ${getStatusColor(order.status)}`,
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 10,
                }}>
                  <div>
                    <b style={{ fontSize: 16 }}>{order.order_code}</b>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  <div style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: getStatusColor(order.status),
                    color: "#fff",
                    fontSize: 12,
                  }}>
                    {order.status}
                  </div>
                </div>

                <div style={{
                  background: "#f5f7fb",
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#555",
                }}>
                  <div>
                    📍 {order.pickup_lat && order.pickup_lng ? (
                      <a
                        href={googleMapsUrl(order.pickup_lat, order.pickup_lng)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563eb", textDecoration: "underline" }}
                      >
                        {order.pickup_location}
                      </a>
                    ) : (
                      order.pickup_location
                    )}
                  </div>
                  <div>→ {order.drop_location}</div>
                  <div style={{ marginTop: 8, fontWeight: "bold", color: "#10b981" }}>
                    Rp{new Intl.NumberFormat("id-ID").format(order.total_price)}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* REQUESTS TAB */}
      {activeTab === "requests" && (
        <>
          <h2 style={{ marginBottom: 15 }}>📝 Request Order</h2>

          {loading ? (
            <div style={{ color: "#666", textAlign: "center" }}>Memuat request...</div>
          ) : requests.length === 0 ? (
            <div style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              color: "#666",
            }}>
              Belum ada request order
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                style={{
                  background: "#fff",
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 8,
                }}>
                  {new Date(request.created_at).toLocaleDateString("id-ID", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}>
                  {request.text}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* DETAIL POPUP MODAL */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "flex-end",
          zIndex: 2000,
        }}>
          <div style={{
            width: "100%",
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            padding: 20,
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            {/* HEADER */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              borderBottom: "1px solid #eee",
              paddingBottom: 15,
            }}>
              <h3 style={{ margin: 0 }}>{selectedOrder.order_code}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            {/* CONTENT */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                background: "#f5f7fb",
                padding: 15,
                borderRadius: 8,
                marginBottom: 15,
              }}>
                <div style={{ marginBottom: 10 }}>
                  <strong>📍 Dari:</strong><br />
                  {selectedOrder.pickup_lat && selectedOrder.pickup_lng ? (
                    <a
                      href={googleMapsUrl(selectedOrder.pickup_lat, selectedOrder.pickup_lng)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      {selectedOrder.pickup_location}
                    </a>
                  ) : (
                    selectedOrder.pickup_location
                  )}
                </div>
                <div>
                  <strong>📍 Ke:</strong><br />
                  {selectedOrder.drop_location}
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 0",
                borderTop: "1px solid #eee",
              }}>
                <span><strong>Total:</strong></span>
                <span style={{ fontSize: 18, fontWeight: "bold", color: "#10b981" }}>
                  Rp{new Intl.NumberFormat("id-ID").format(selectedOrder.total_price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            width: "90%",
            maxWidth: 400,
          }}>
            <h3 style={{ marginBottom: 15 }}>Buat Request Order</h3>
            <form onSubmit={handleSubmitRequest}>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ text: e.target.value })}
                placeholder="Masukkan detail request order..."
                rows={6}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  padding: "12px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                required
              />
              <div style={{
                display: "flex",
                gap: 10,
                marginTop: 15,
              }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Mengirim..." : "Kirim Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ADD BUTTON - only show on requests tab */}
      {activeTab === "requests" && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: "fixed",
            bottom: 100,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            background: "#10b981",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            zIndex: 999,
          }}
        >
          +
        </button>
      )}
    </div>
  );
}