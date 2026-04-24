import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const googleMapsUrl = (lat, lng) => {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

export default function Order() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("new");
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const activeRes = await API.get("/orders/driver_assigned/");
      const assigned = activeRes.data || [];
      setActiveOrder(assigned.length > 0 ? assigned[0] : null);

      if (assigned.length > 0) {
        setOrders(assigned);
      } else if (filter === "my") {
        const myRes = await API.get("/orders/driver_assigned/");
        setOrders(myRes.data || []);
      } else {
        const res = await API.get("/orders/driver_available/");
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();

    const handleRealtimeUpdate = () => {
      fetchOrders();
    };

    window.addEventListener("driver-order-update", handleRealtimeUpdate);
    return () => window.removeEventListener("driver-order-update", handleRealtimeUpdate);
  }, [filter, fetchOrders]);

  const acceptOrder = async (orderId) => {
    setAcceptingOrderId(orderId);
    try {
      await API.post(`/orders/${orderId}/driver_accept/`, {});
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "✅ Order Diterima",
          message: "Order berhasil diambil. Silakan mulai pengiriman.",
        },
      }));
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error || err.response?.data?.detail;
      const message = serverMessage || "Gagal menerima order. Silakan refresh dan coba lagi.";
      let title = "⚠️ Gagal Mengambil Order";

      if (status === 400 || status === 409) {
        title = "⚠️ Order Tidak Tersedia";
      } else if (status === 403) {
        title = "⚠️ Akses Ditolak";
      }

      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title,
          message,
        },
      }));

      if ([400, 403, 409].includes(status)) {
        setSelectedOrder(null);
        await fetchOrders();
      }
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await API.post(`/orders/${orderId}/driver_complete/`, {});
      setSelectedOrder(null);
      fetchOrders();
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "✅ Order Selesai",
          message: "Order berhasil diselesaikan dan chat telah ditutup.",
        },
      }));
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "⚠️ Gagal Selesai",
          message: err.response?.data?.error || "Tidak dapat menyelesaikan order saat ini.",
        },
      }));
    }
  };

  const requestCancelOrder = async (orderId) => {
    try {
      await API.post(`/orders/${orderId}/request_cancel/`, {});
      setSelectedOrder(null);
      fetchOrders();
      navigate(`/chat?order=${orderId}`);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "✉️ Permintaan batal dikirim",
          message: "Admin telah diberitahu dan chat support dibuka.",
        },
      }));
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "⚠️ Gagal mengirim permintaan batal",
          message: err.response?.data?.error || "Coba lagi nanti.",
        },
      }));
    }
  };

  const operHandleOrder = async (orderId) => {
    try {
      const res = await API.post(`/orders/${orderId}/oper_handle/`, {});
      setSelectedOrder(null);
      fetchOrders();
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "🛑 Oper handled",
          message: res.data.suspension_reason || "Anda disuspend sementara.",
        },
      }));
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: {
          title: "⚠️ Gagal oper handle",
          message: err.response?.data?.error || "Coba lagi nanti.",
        },
      }));
    }
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100vh",
      background: "#f5f7fb",
    }}>
      <h2 style={{ marginBottom: 15 }}>📦 Order</h2>

      {/* SHOW ACTIVE ORDER IF EXISTS */}
      {activeOrder && (
        <div style={{
          background: "#e0f7e0",
          padding: 15,
          borderRadius: 12,
          marginBottom: 20,
          borderLeft: "4px solid #10b981",
        }}>
          <div style={{ fontWeight: "bold", color: "#10b981", marginBottom: 8 }}>
            ✓ Anda sudah memiliki 1 order aktif
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Selesaikan order ini terlebih dahulu untuk mengambil order baru
          </div>
        </div>
      )}

      {/* FILTER TABS - HIDE IF HAS ACTIVE ORDER */}
      {!activeOrder && (
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}>
        <button
          onClick={() => setFilter("new")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: filter === "new" ? "#667eea" : "#ddd",
            color: filter === "new" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          Order Baru
        </button>

        <button
          onClick={() => setFilter("my")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: filter === "my" ? "#667eea" : "#ddd",
            color: filter === "my" ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          Order Saya
        </button>
      </div>
      )}

      {/* ORDER LIST */}
      {loading ? (
        <div style={{ color: "#666", textAlign: "center" }}>Memuat order...</div>
      ) : orders.length === 0 ? (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          textAlign: "center",
          color: "#666",
        }}>
          Tidak ada order
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
                  Status: {order.status}
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
              fontSize: 14,
              color: "#555",
            }}>
              <div>
                📍 Pickup: {order.pickup_lat && order.pickup_lng ? (
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
              <div>🎯 Tujuan: {order.drop_location}</div>
              <div>💰 Total: Rp{new Intl.NumberFormat("id-ID").format(order.total_price)}</div>
            </div>
          </div>
        ))
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
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            {/* DETAIL INFO */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                background: "#f5f7fb",
                padding: 15,
                borderRadius: 12,
                marginBottom: 15,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Pickup Location</div>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>
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
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Drop Location</div>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>{selectedOrder.drop_location}</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Status</div>
                  <div style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: getStatusColor(selectedOrder.status),
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}>
                    {selectedOrder.status}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Total Harga</div>
                  <div style={{ fontWeight: "bold", fontSize: 18, color: "#10b981" }}>
                    Rp{new Intl.NumberFormat("id-ID").format(selectedOrder.total_price)}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedOrder.status === "pending" && (
                <button
                  onClick={() => acceptOrder(selectedOrder.id)}
                  disabled={acceptingOrderId === selectedOrder.id}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 10,
                    border: "none",
                    background: acceptingOrderId === selectedOrder.id ? "#7dd3fc" : "#10b981",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    cursor: acceptingOrderId === selectedOrder.id ? "not-allowed" : "pointer",
                    opacity: acceptingOrderId === selectedOrder.id ? 0.85 : 1,
                  }}
                >
                  {acceptingOrderId === selectedOrder.id ? "Mengambil..." : "✓ Terima Order"}
                </button>
              )}

              {selectedOrder.status === "assigned" && (
                <>
                  <button
                    onClick={() => navigate(`/chat/${selectedOrder.customer}?name=${encodeURIComponent(selectedOrder.customer_name || 'Customer')}&order=${selectedOrder.id}`)}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #667eea",
                      background: "transparent",
                      color: "#667eea",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    💬 Chat {selectedOrder.customer_name || 'Customer'}
                  </button>

                  <button
                    onClick={() => completeOrder(selectedOrder.id)}
                    disabled={
                      selectedOrder.accepted_at &&
                      Date.now() - new Date(selectedOrder.accepted_at).getTime() < 5 * 60 * 1000
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "none",
                      background: selectedOrder.accepted_at && Date.now() - new Date(selectedOrder.accepted_at).getTime() < 5 * 60 * 1000 ? "#93c5fd" : "#3b82f6",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: selectedOrder.accepted_at && Date.now() - new Date(selectedOrder.accepted_at).getTime() < 5 * 60 * 1000 ? "not-allowed" : "pointer",
                    }}
                  >
                    ✓ Selesai
                  </button>
                  {selectedOrder.accepted_at && Date.now() - new Date(selectedOrder.accepted_at).getTime() < 5 * 60 * 1000 && (
                    <div style={{ color: "#92400e", fontSize: 13, marginTop: 6 }}>
                      Tombol selesai akan aktif setelah 5 menit dari penerimaan order.
                    </div>
                  )}

                  

                  <button
                    onClick={() => requestCancelOrder(selectedOrder.id)}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #ff6b6b",
                      background: "transparent",
                      color: "#ff6b6b",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Batal
                  </button>

                  <button
                    onClick={() => operHandleOrder(selectedOrder.id)}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #f59e0b",
                      background: "transparent",
                      color: "#f59e0b",
                      fontWeight: "bold",
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    🛑 Oper
                  </button>

                  
                </>
              )}

              {selectedOrder.status === "done" && (
                <div style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 10,
                  background: "#e0f7e0",
                  color: "#10b981",
                  textAlign: "center",
                  fontWeight: "bold",
                }}>
                  ✓ Order Selesai
                </div>
              )}
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 10,
                borderRadius: 10,
                border: "none",
                background: "#f0f0f0",
                color: "#666",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
