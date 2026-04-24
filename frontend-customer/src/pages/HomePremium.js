import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const SERVICES = [
  { key: "delivery", label: "Delivery Order", caption: "Belanja, makanan, kebutuhan harian", tone: "#d7b56d" },
  { key: "ojek", label: "Ojek", caption: "Perjalanan cepat dan nyaman", tone: "#7dd3fc" },
  { key: "kurir", label: "Kuri", caption: "Barang penting dengan detail penerima", tone: "#86efac" },
  { key: "gift", label: "Gift Order", caption: "Hadiah dan kejutan personal", tone: "#f9a8d4" },
];

const formatMoney = (value) => `Rp${new Intl.NumberFormat("id-ID").format(value || 0)}`;

export default function HomePremium() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    Promise.all([API.get("/auth/me/"), API.get("/orders/active/")])
      .then(([userRes, orderRes]) => {
        setUser(userRes.data);
        setOrders(orderRes.data);
      })
      .catch((error) => console.error(error));
  }, []);

  const gotoService = (serviceKey) => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(`/orderform?service=${serviceKey}`);
  };

  const viewAllServices = () => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }
    navigate("/orderselect");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "18px 16px 110px",
        background:
          "radial-gradient(circle at top left, rgba(125,211,252,0.15), transparent 24%), radial-gradient(circle at top right, rgba(215,181,109,0.18), transparent 22%), linear-gradient(180deg, #081120 0%, #101827 42%, #f3eee4 42%, #f7f4ed 100%)",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 18 }}>
        <section
          style={{
            borderRadius: 30,
            padding: 24,
            background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.90))",
            color: "#f8fafc",
            boxShadow: "0 28px 70px rgba(2, 6, 23, 0.45)",
          }}
        >
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.72 }}>
            Jojo App
          </div>
          

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {["Preview live", "Multi-stop", "Fast submit"].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 18,
                  padding: "12px 10px",
                  background: "rgba(255,255,255,0.07)",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: 28,
            padding: 18,
            background: "rgba(255,255,255,0.74)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#0f172a" }}>Pilih Layanan</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Masuk lewat flow yang lebih terstruktur.</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {SERVICES.map((service) => (
              <button
                key={service.key}
                type="button"
                onClick={() => gotoService(service.key)}
                style={{
                  border: "none",
                  borderRadius: 24,
                  padding: 18,
                  textAlign: "left",
                  background: `linear-gradient(135deg, ${service.tone}22, rgba(255,255,255,0.95))`,
                  boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.16)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{service.label}</div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{service.caption}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={viewAllServices}
            style={{
              marginTop: 16,
              width: "100%",
              border: "none",
              borderRadius: 22,
              padding: "18px 20px",
              background: "linear-gradient(135deg, #111827, #334155)",
              color: "#f8fafc",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📋 Lihat Semua Layanan
          </button>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Order Aktif</div>

          {orders.length === 0 ? (
            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: "rgba(255,255,255,0.78)",
                color: "#64748b",
                boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
              }}
            >
              Belum ada order aktif.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(255,255,255,0.84)",
                  boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{order.order_code || `Order #${order.id}`}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{order.pickup_location}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{order.drop_location}</div>
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "8px 12px",
                      background: "rgba(15,23,42,0.08)",
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}
                  >
                    {order.status}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, color: "#0f172a" }}>
                  <span>{formatMoney(order.total_price)}</span>
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
