import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function History() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes timelineGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(0,217,255,0.3); }
        50% { box-shadow: 0 0 40px rgba(0,217,255,0.8); }
      }

      @keyframes particleFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
        50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
      }

      @keyframes cardMorph {
        0% { border-radius: 20px; transform: scale(1); }
        50% { border-radius: 30px; transform: scale(1.02); }
        100% { border-radius: 20px; transform: scale(1); }
      }

      @keyframes statusPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.3); opacity: 1; }
      }

      @keyframes hologramFlicker {
        0%, 100% { opacity: 1; }
        2% { opacity: 0.8; }
        4% { opacity: 1; }
        8% { opacity: 0.9; }
        10% { opacity: 1; }
        15% { opacity: 0.85; }
        20% { opacity: 1; }
      }

      .timeline-particle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: #00d9ff;
        border-radius: 50%;
        animation: particleFloat 4s ease-in-out infinite;
      }

      .order-card {
        background: linear-gradient(135deg, rgba(15,15,30,0.9), rgba(26,0,51,0.9));
        backdrop-filter: blur(15px);
        border: 1px solid rgba(0,217,255,0.3);
        animation: cardMorph 6s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .order-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, transparent, rgba(0,217,255,0.1), transparent);
        animation: hologramFlicker 3s ease-in-out infinite;
      }

      .status-dot {
        animation: statusPulse 2s ease-in-out infinite;
      }

      .timeline-connector {
        background: linear-gradient(to bottom, #00d9ff, #ff006e, #00d9ff);
        background-size: 200% 200%;
        animation: timelineGlow 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    // Fetch data
    API.get("/orders/history/")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 🎨 Enhanced status styling
  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        color: "#ffa500",
        bg: "linear-gradient(135deg, #ffa500, #ff8c00)",
        icon: "⏳",
        glow: "rgba(255,165,0,0.5)"
      },
      assigned: {
        color: "#3498db",
        bg: "linear-gradient(135deg, #3498db, #2980b9)",
        icon: "🚗",
        glow: "rgba(52,152,219,0.5)"
      },
      on_delivery: {
        color: "#9b59b6",
        bg: "linear-gradient(135deg, #9b59b6, #8e44ad)",
        icon: "📦",
        glow: "rgba(155,89,182,0.5)"
      },
      done: {
        color: "#2ecc71",
        bg: "linear-gradient(135deg, #2ecc71, #27ae60)",
        icon: "✅",
        glow: "rgba(46,204,113,0.5)"
      }
    };
    return styles[status] || {
      color: "#ccc",
      bg: "linear-gradient(135deg, #ccc, #999)",
      icon: "❓",
      glow: "rgba(204,204,204,0.5)"
    };
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #2d004d 100%)",
      color: "#f8fafc",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* PARTICLE BACKGROUND */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none"
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="timeline-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <div style={{
        padding: "30px 20px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 2
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 28,
          background: "linear-gradient(135deg, #00d9ff, #ff006e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 30px rgba(0,217,255,0.5)",
          animation: "hologramFlicker 4s ease-in-out infinite"
        }}>
          🗓️ Riwayat Order Kamu
        </h1>
        <p style={{
          margin: "10px 0 0",
          fontSize: 14,
          color: "rgba(248,250,252,0.7)",
          fontStyle: "italic"
        }}>
          Jelajahi kontinum ruang-waktu dari pengirimanmu
        </p>
      </div>

      {/* CONTENT */}
      <div style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px 100px",
        position: "relative",
        zIndex: 2
      }}>

        {loading ? (
          <div style={{
            textAlign: "center",
            padding: 40
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(0,217,255,0.3)",
              borderTop: "3px solid #00d9ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }} />
            <p style={{ color: "rgba(248,250,252,0.7)" }}>
              Memindai riwayat order...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="order-card" style={{
            padding: 40,
            textAlign: "center",
            marginTop: 20
          }}>
            <div style={{
              fontSize: 48,
              marginBottom: 20,
              opacity: 0.6
            }}>
              🌌
            </div>
            <h3 style={{
              margin: "0 0 10px",
              color: "#f8fafc"
            }}>
              Riwayat kosong
            </h3>
            <p style={{
              margin: 0,
              color: "rgba(248,250,252,0.7)",
              fontSize: 14
            }}>
              Your delivery expeditions will appear here once initiated
            </p>
          </div>
        ) : (
          <div style={{
            position: "relative",
            paddingLeft: 40
          }}>

            {/* TIMELINE CONNECTOR */}
            <div style={{
              position: "absolute",
              left: 20,
              top: 0,
              bottom: 0,
              width: 4,
              background: "linear-gradient(to bottom, #00d9ff, #ff006e, #00d9ff)",
              backgroundSize: "200% 200%",
              animation: "timelineGlow 3s ease-in-out infinite",
              borderRadius: 2
            }} />

            {data.map((order, index) => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <div key={order.id} style={{
                  position: "relative",
                  marginBottom: 30,
                  animation: `cardMorph 6s ease-in-out infinite ${index * 0.5}s`
                }}>

                  {/* STATUS DOT */}
                  <div className="status-dot" style={{
                    position: "absolute",
                    left: 10,
                    top: 20,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: statusStyle.bg,
                    border: "3px solid rgba(15,15,30,0.8)",
                    boxShadow: `0 0 20px ${statusStyle.glow}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    zIndex: 3
                  }}>
                    {statusStyle.icon}
                  </div>

                  {/* ORDER CARD */}
                  <div className="order-card" style={{
                    marginLeft: 40,
                    padding: 20,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative"
                  }}
                  onClick={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = "scale(0.98)";
                    setTimeout(() => card.style.transform = "", 150);
                    setSelectedOrder(order);
                  }}>

                    {/* CARD CONTENT */}
                    <div style={{
                      position: "relative",
                      zIndex: 2
                    }}>

                      {/* HEADER */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 15
                      }}>
                        <div>
                          <h3 style={{
                            margin: "0 0 5px",
                            fontSize: 16,
                            color: "#f8fafc"
                          }}>
                            Order ID #{order.id}
                          </h3>
                          <div style={{
                            fontSize: 12,
                            color: "rgba(248,250,252,0.6)"
                          }}>
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* STATUS BADGE */}
                        <div style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          background: statusStyle.bg,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          boxShadow: `0 4px 12px ${statusStyle.glow}`
                        }}>
                          {statusStyle.icon} {order.status.replace('_', ' ')}
                        </div>
                      </div>

                      {/* LOCATIONS */}
                      <div style={{
                        marginBottom: 15
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                          fontSize: 14,
                          color: "#f8fafc"
                        }}>
                          <span style={{
                            width: 20,
                            textAlign: "center",
                            marginRight: 10
                          }}>
                            📍
                          </span>
                          <span style={{
                            flex: 1,
                            opacity: 0.9
                          }}>
                            {order.pickup_location}
                          </span>
                        </div>

                        <div style={{
                          width: 2,
                          height: 20,
                          background: "linear-gradient(to bottom, #00d9ff, #ff006e)",
                          margin: "0 auto 8px",
                          borderRadius: 1
                        }} />

                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: 14,
                          color: "#f8fafc"
                        }}>
                          <span style={{
                            width: 20,
                            textAlign: "center",
                            marginRight: 10
                          }}>
                            📦
                          </span>
                          <span style={{
                            flex: 1,
                            opacity: 0.9
                          }}>
                            {order.drop_location}
                          </span>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 15,
                        borderTop: "1px solid rgba(255,255,255,0.1)"
                      }}>
                        <div style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: "#00d9ff"
                        }}>
                          Rp{order.total_price?.toLocaleString() || 'N/A'}
                        </div>

                        {order.driver && (order.status === 'assigned' || order.status === 'on_delivery') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chat/${order.driver}?name=${order.driver_name || 'Driver'}&order=${order.id}`);
                            }}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 25,
                              border: "1px solid #00d9ff",
                              background: "linear-gradient(135deg, rgba(0,217,255,0.1), rgba(255,0,110,0.1))",
                              color: "#00d9ff",
                              fontSize: 12,
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              boxShadow: "0 4px 12px rgba(0,217,255,0.2)"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.boxShadow = "0 6px 20px rgba(0,217,255,0.4)";
                              e.target.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.boxShadow = "0 4px 12px rgba(0,217,255,0.2)";
                              e.target.style.transform = "";
                            }}
                          >
                            🚀 Chat Driver
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 10, 30, 0.78)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          zIndex: 999
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            width: "min(96%, 540px)",
            maxHeight: "calc(100vh - 60px)",
            overflowY: "auto",
            borderRadius: 28,
            background: "linear-gradient(180deg, rgba(8,10,30,0.98), rgba(15,15,45,0.98))",
            border: "1px solid rgba(0,217,255,0.18)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            padding: 24,
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(248,250,252,0.12)",
                borderRadius: "50%",
                width: 34,
                height: 34,
                color: "#f8fafc",
                fontSize: 18,
                cursor: "pointer"
              }}
            >
              ×
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#00d9ff" }}>Detail Pesanan #{selectedOrder.id}</div>
              <div style={{ marginTop: 8, color: "rgba(248,250,252,0.75)", fontSize: 14 }}>
                {selectedOrder.service_type ? selectedOrder.service_type.replace('_', ' ') : 'Layanan tidak diketahui'} • {selectedOrder.status.replace('_', ' ')}
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>Ringkasan Model</div>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16, color: "#f8fafc", lineHeight: 1.65, minHeight: 100 }}>
                  {selectedOrder.model_summary || selectedOrder.summary || selectedOrder.note || "Ringkasan tidak tersedia untuk pesanan ini."}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                  <span>Status</span>
                  <span style={{ color: "#f8fafc" }}>{selectedOrder.status.replace('_', ' ')}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                  <span>Total Harga</span>
                  <span style={{ color: "#00d9ff", fontWeight: 700 }}>{selectedOrder.total_price ? `Rp${Number(selectedOrder.total_price).toLocaleString()}` : "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                  <span>Pickup</span>
                  <span style={{ color: "#f8fafc", textAlign: "right", maxWidth: "70%" }}>{selectedOrder.pickup_location || '-'}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                  <span>Drop</span>
                  <span style={{ color: "#f8fafc", textAlign: "right", maxWidth: "70%" }}>{selectedOrder.drop_location || '-'}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8, background: "rgba(0,217,255,0.05)", border: "1px solid rgba(0,217,255,0.12)", borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>Detail lengkap</div>
                {selectedOrder.recipient_name && (
                  <div style={{ color: "#f8fafc" }}>Penerima: {selectedOrder.recipient_name}</div>
                )}
                {selectedOrder.recipient_phone && (
                  <div style={{ color: "#f8fafc" }}>Kontak penerima: {selectedOrder.recipient_phone}</div>
                )}
                {selectedOrder.customer_address && (
                  <div style={{ color: "#f8fafc" }}>Alamat pengirim: {selectedOrder.customer_address}</div>
                )}
                {selectedOrder.note && (
                  <div style={{ color: "#f8fafc" }}>Catatan: {selectedOrder.note}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}