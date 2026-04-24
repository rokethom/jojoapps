import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

const SERVICES = [
  {
    id: "delivery",
    name: "Delivery Order",
    description: "Belanja, makanan, dan kebutuhan harian",
    icon: "📦",
    color: "#d7b56d",
    emoji: "🛍️",
    features: ["Titip detail", "Multi-item", "Tracking real-time"]
  },
  {
    id: "ojek",
    name: "Ojek",
    description: "Perjalanan cepat dan nyaman",
    icon: "🏍️",
    color: "#7dd3fc",
    emoji: "🚴",
    features: ["Pickup cepat", "Rute pintar", "Safe riding"]
  },
  {
    id: "kurir",
    name: "Kuri",
    description: "Barang penting dengan penerima jelas",
    icon: "📮",
    color: "#86efac",
    emoji: "📬",
    features: ["Identitas jelas", "Handling hati-hati", "Konfirmasi terima"]
  },
  {
    id: "belanja",
    name: "Belanja",
    description: "Shopping assistant untuk kebutuhan Anda",
    icon: "🛒",
    color: "#fdba74",
    emoji: "🏪",
    features: ["Multi-store", "Wishlist", "Counter offer"]
  },
  {
    id: "gift",
    name: "Gift Order",
    description: "Hadiah spesial dengan sentuhan personal",
    icon: "🎁",
    color: "#f9a8d4",
    emoji: "🎀",
    features: ["Gift wrapping", "Personal message", "Surprise delivery"]
  },
  {
    id: "epajak",
    name: "Epajak",
    description: "Layanan pajak digital dan terpercaya",
    icon: "📋",
    color: "#a78bfa",
    emoji: "📊",
    features: ["Dokumen aman", "Tim profesional", "Konsultasi gratis"]
  },
  {
    id: "etilang",
    name: "Etilang",
    description: "Pengurusan tilang dengan mudah",
    icon: "🚗",
    color: "#fb7185",
    emoji: "🚨",
    features: ["Proses cepat", "Dokumen lengkap", "Kerjasama resmi"]
  },
  {
    id: "travel",
    name: "Travel",
    description: "Perjalanan aman dan menyenangkan",
    icon: "✈️",
    color: "#38bdf8",
    emoji: "🌍",
    features: ["Paket lengkap", "Pemandu berpengalaman", "Harga kompetitif"]
  },
  {
    id: "joker_mobil",
    name: "Joker Mobil",
    description: "Rental mobil dengan fleksibilitas tinggi",
    icon: "🚙",
    color: "#fbbf24",
    emoji: "🏎️",
    features: ["Berbagai tipe", "Driver profesional", "Asuransi lengkap"]
  }
];

export default function OrderServiceSelection() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedService, setSelectedService] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const filteredServices = SERVICES.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectService = (serviceId) => {
    navigate(`/orderform?service=${serviceId}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b1020 0%, #111827 20%, #f3eee4 80%, #f7f4ed 100%)",
        paddingBottom: 110,
        color: "#111827"
      }}
    >
      {/* Header Section */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "20px 16px 0"
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            marginBottom: 16
          }}
        >
          ← Kembali
        </button>

        {/* Hero Section */}
        <section
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
            borderRadius: 32,
            padding: 28,
            color: "#f8fafc",
            marginBottom: 28,
            boxShadow: "0 30px 80px rgba(2, 6, 23, 0.45)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -45px -55px auto",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(125,211,252,0.2), transparent 70%)",
              filter: "blur(8px)"
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h1
              style={{
                margin: "0 0 12px",
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              Pilih Layanan
            </h1>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 15,
                color: "rgba(226, 232, 240, 0.8)",
                lineHeight: 1.6
              }}
            >
              Tersedia {filteredServices.length} layanan untuk kebutuhan Anda
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(226, 232, 240, 0.6)"
              }}
            >
              Setiap layanan dilengkapi dengan form premium dan tracking real-time
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            marginBottom: 24
          }}
        >
          <input
            type="text"
            placeholder="Cari layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "1.5px solid rgba(0,0,0,0.1)",
              fontSize: 14,
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              outline: "none",
              transition: "all 0.2s"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18
            }}
          >
            🔍
          </div>
        </div>

        {/* Services Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12
          }}
        >
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
              onClick={() => handleSelectService(service.id)}
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: 20,
                padding: 16,
                cursor: "pointer",
                border: "1.5px solid rgba(0,0,0,0.06)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredService === service.id ? "translateX(8px)" : "translateX(0)",
                boxShadow:
                  hoveredService === service.id
                    ? `0 12px 32px ${service.color}22`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Accent Line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: service.color,
                  transform:
                    hoveredService === service.id ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "top",
                  transition: "transform 0.3s"
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start"
                }}
              >
                {/* Icon Circle */}
                <div
                  style={{
                    minWidth: 56,
                    height: 56,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${service.color}20, ${service.color}08)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    transition: "all 0.3s"
                  }}
                >
                  {service.emoji}
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#0f172a"
                    }}
                  >
                    {service.name}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      color: "#64748b",
                      lineHeight: 1.4
                    }}
                  >
                    {service.description}
                  </p>

                  {/* Features Pills */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginTop: 8,
                      maxHeight: hoveredService === service.id ? 80 : 24,
                      overflow: "hidden",
                      transition: "max-height 0.3s"
                    }}
                  >
                    {service.features.map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: `${service.color}15`,
                          color: service.color,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    fontSize: 20,
                    transform:
                      hoveredService === service.id ? "translateX(4px)" : "translateX(0)",
                    transition: "transform 0.3s"
                  }}
                >
                  →
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#6b7280"
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ margin: 0, fontSize: 14 }}>
              Tidak ada layanan yang ditemukan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
