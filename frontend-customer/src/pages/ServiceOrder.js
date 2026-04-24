import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🎨 ANIMATION STYLES
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .chat-field {
    animation: fadeInUp 0.5s ease-out forwards;
  }
`;

// Inject styles
if (typeof window !== "undefined" && !document.getElementById("chat-form-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "chat-form-styles";
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

const SERVICE_OPTIONS = [
  {
    value: "delivery",
    label: "Delivery Order",
    icon: "📦",
    accent: "#d7b56d",
    blurb: "Titip belanja, makanan, dan kebutuhan harian dengan briefing detail.",
  },
  {
    value: "ojek",
    label: "Ojek",
    icon: "🏍️",
    accent: "#7dd3fc",
    blurb: "Perjalanan cepat dengan pickup jelas dan destinasi rapi.",
  },
  {
    value: "kurir",
    label: "Kuri",
    icon: "📮",
    accent: "#86efac",
    blurb: "Kirim barang dengan identitas penerima dan catatan handling.",
  },
  {
    value: "gift",
    label: "Gift Order",
    icon: "🎁",
    accent: "#f9a8d4",
    blurb: "Kirim kejutan, hampers, atau hadiah dengan sentuhan personal.",
  },
  {
    value: "belanja",
    label: "Belanja",
    icon: "🛒",
    accent: "#fdba74",
    blurb: "Belanja multi-item dengan catatan item yang tetap terbaca jelas.",
  },
  {
    value: "epajak",
    label: "Epajak",
    icon: "📋",
    accent: "#a78bfa",
    blurb: "Layanan pajak digital dengan dokumen aman dan tim profesional.",
  },
  {
    value: "etilang",
    label: "Etilang",
    icon: "🚗",
    accent: "#fb7185",
    blurb: "Pengurusan tilang dengan proses cepat dan kerjasama resmi.",
  },
  {
    value: "travel",
    label: "Travel",
    icon: "✈️",
    accent: "#38bdf8",
    blurb: "Perjalanan aman dan menyenangkan dengan paket lengkap dan pemandu berpengalaman.",
  },
  {
    value: "joker_mobil",
    label: "Joker Mobil",
    icon: "🏎️",
    accent: "#fbbf24",
    blurb: "Rental mobil fleksibel dengan berbagai tipe dan driver profesional.",
  },
];

const PREMIUM_PRESETS = {
  delivery: {
    item_name: "Paket belanja premium",
    note: "Mohon cek ulang item sebelum checkout dan prioritaskan barang paling penting.",
  },
  ojek: {
    item_name: "Trip perjalanan",
    note: "Hubungi sebelum tiba agar pickup lebih mulus.",
  },
  kurir: {
    item_name: "Dokumen / barang penting",
    note: "Jaga paket tetap aman dan konfirmasi saat serah terima.",
  },
  gift: {
    item_name: "Gift box eksklusif",
    note: "Tolong antar dengan rapi dan beri kabar saat sudah diterima.",
  },
  belanja: {
    item_name: "Titip belanja rumah",
    note: "Jika item utama kosong, pilih alternatif yang paling mendekati.",
  },
  epajak: {
    item_name: "Dokumen pajak dan persyaratan",
    note: "Pastikan semua dokumen lengkap dan jelas untuk proses cepat.",
  },
  etilang: {
    item_name: "Berkas tilang dan identitas",
    note: "Siapkan surat tilang, KTP, dan STNK dengan kondisi baik.",
  },
  travel: {
    item_name: "Paket perjalanan wisata",
    note: "Sebutkan preferensi hotel, aktivitas, dan kebutuhan khusus perjalanan.",
  },
  joker_mobil: {
    item_name: "Rental mobil untuk kebutuhan",
    note: "Tentukan tipe mobil, durasi rental, dan tujuan perjalanan.",
  },
};

const currency = (value) => `Rp${new Intl.NumberFormat("id-ID").format(value || 0)}`;

export default function ServiceOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const selectedFromQuery = searchParams.get("service");

  const [profile, setProfile] = useState(user || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [extraStops, setExtraStops] = useState([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [currentMapField, setCurrentMapField] = useState("");
  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default
  const [form, setForm] = useState({
    service_type: selectedFromQuery || "delivery",
    pickup_location: "",
    drop_location: "",
    recipient_name: "",
    recipient_phone: "",
    item_name: PREMIUM_PRESETS[selectedFromQuery || "delivery"]?.item_name || "Paket belanja premium",
    quantity: 1,
    unit_price: 0,
    note: PREMIUM_PRESETS[selectedFromQuery || "delivery"]?.note || "",
    extra_stops_text: "",
  });

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const res = await API.get("/auth/me/");
        if (!active) return;

        setProfile(res.data);
        setForm((prev) => ({
          ...prev,
          pickup_location: prev.pickup_location || res.data.address || "",
          recipient_name: prev.recipient_name || res.data.name || "",
          recipient_phone: prev.recipient_phone || res.data.phone || "",
        }));
      } catch (error) {
        console.error(error);
      }
    };

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInStep {
        0% { opacity: 0; transform: translateX(20px); }
        100% { opacity: 1; transform: translateX(0); }
      }

      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }

      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(15,23,42,0.1); }
        50% { box-shadow: 0 0 0 8px rgba(15,23,42,0); }
      }

      .form-step {
        animation: slideInStep 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .service-chip {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }

      .service-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      }

      .service-chip.active {
        animation: fadeInScale 0.3s ease-out;
      }

      .step-progress {
        position: relative;
        height: 4px;
        background: rgba(148,163,184,0.2);
        border-radius: 999px;
        overflow: hidden;
      }

      .step-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 999px;
      }
    `;
    document.head.appendChild(style);

    bootstrap();
    return () => {
      active = false;
      document.head.removeChild(style);
    };
  }, []);

  const extraStopsText = useMemo(
    () => extraStops.join("\n"),
    [extraStops]
  );

  useEffect(() => {
    setForm(prev => ({ ...prev, extra_stops_text: extraStopsText }));
  }, [extraStopsText]);

  useEffect(() => {
    const hasCoreFields = form.pickup_location.trim() && form.drop_location.trim();
    if (!hasCoreFields) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await API.post("/orders/service-preview/", {
          ...form,
          extra_stops: extraStops,
        });
        setPreview(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setPreviewLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form, extraStops]);

  const currentService = SERVICE_OPTIONS.find((item) => item.value === form.service_type) || SERVICE_OPTIONS[0];
  const needsRecipient = ["kurir", "gift", "travel"].includes(form.service_type);

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFeedback("");
    
    // Special handling for service_type change
    if (field === "service_type") {
      const preset = PREMIUM_PRESETS[value];
      setForm((prev) => ({
        ...prev,
        service_type: value,
        item_name: preset?.item_name || "",
        note: preset?.note || "",
      }));
      setCurrentStep(1);
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  // 🔥 GET CURRENT LOCATION FOR EXTRA STOP
  const getCurrentLocationForExtraStop = (index) => {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung di device ini");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // reverse geocoding (pakai OpenStreetMap free)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();

          const address = data.display_name || `${lat}, ${lng}`;

          setExtraStops((prev) => {
            const newStops = [...prev];
            newStops[index] = address;
            return newStops;
          });
        } catch (err) {
          console.error(err);
          alert("Gagal ambil alamat dari GPS");
        }
      },
      (error) => {
        alert("Gagal ambil lokasi. Izinkan GPS ya.");
      }
    );
  };

  // 🔥 OPEN MAP PICKER FOR EXTRA STOP
  const openMapPickerForExtraStop = (index) => {
    setCurrentMapField(`extra_stop_${index}`);
    setMapCenter([-6.2088, 106.8456]); // Default Jakarta
    setShowMapPicker(true);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.pickup_location.trim()) nextErrors.pickup_location = "Lokasi jemput wajib diisi.";
    if (!form.drop_location.trim()) nextErrors.drop_location = "Lokasi tujuan wajib diisi.";
    if (needsRecipient && !form.recipient_name.trim()) nextErrors.recipient_name = "Nama penerima wajib diisi.";
    if (needsRecipient && !form.recipient_phone.trim()) nextErrors.recipient_phone = "Nomor penerima wajib diisi.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback("");

    try {
      await API.post("/orders/service-create/", {
        ...form,
        extra_stops: extraStops,
      });
      navigate("/history");
    } catch (error) {
      console.error(error);
      setErrors(error.response?.data?.errors || {});
      setFeedback(error.response?.data?.detail || "Order belum berhasil dibuat. Coba cek data lalu kirim ulang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const smartBrief = [
    `${currentService.label} aktif`,
    preview?.distance ? `jarak ${preview.distance} km` : "harga adaptif aktif",
    `${extraStops.length + 1} titik perjalanan`,
    profile?.branch?.name ? `branch ${profile.branch.name}` : "branch otomatis",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px 16px 110px",
        background:
          "radial-gradient(circle at top left, rgba(215,181,109,0.18), transparent 28%), radial-gradient(circle at top right, rgba(125,211,252,0.15), transparent 25%), linear-gradient(180deg, #0b1020 0%, #111827 46%, #f5efe2 46%, #f7f2ea 100%)",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 18 }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/orderselect")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 0",
            cursor: "pointer",
            color: "#64748b",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
        >
          ← Pilih layanan lain
        </button>
        <section
          style={{
            borderRadius: 32,
            padding: 24,
            color: "#f8fafc",
            background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92))",
            boxShadow: "0 30px 80px rgba(2, 6, 23, 0.45)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -45px -55px auto",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${currentService.accent}55, transparent 65%)`,
              filter: "blur(6px)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, position: "relative" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  letterSpacing: "0.12em",
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                Form Layanan Jojo
              </div>
              <h1 style={{ margin: "16px 0 10px", fontSize: 30, lineHeight: 1.05 }}>
                Order cepat, tapi tetap terasa crafted.
              </h1>
              <p style={{ margin: 0, color: "rgba(226,232,240,0.78)", lineHeight: 1.6 }}>
                Ganti flow chatbot dengan workspace layanan yang lebih tajam, lebih singkat, dan lebih enak dipakai.
              </p>
            </div>
            <div
              style={{
                minWidth: 72,
                height: 72,
                borderRadius: 24,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                background: `linear-gradient(135deg, ${currentService.accent}, rgba(255,255,255,0.18))`,
                color: "#0f172a",
                boxShadow: `0 20px 40px ${currentService.accent}33`,
              }}
            >
              {currentService.icon}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {smartBrief.map((item) => (
              <span
                key={item}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: 28,
            padding: 18,
            background: "rgba(255,255,255,0.68)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {SERVICE_OPTIONS.map((service) => (
              <button
                key={service.value}
                type="button"
                onClick={() => handleChange("service_type", service.value)}
                style={{
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 22,
                  border: form.service_type === service.value ? `1px solid ${service.accent}` : "1px solid rgba(148,163,184,0.18)",
                  background: form.service_type === service.value ? `${service.accent}18` : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{service.label}</div>
                <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>{service.blurb}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 🎨 CONVERSATIONAL FORM */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: 0,
            borderRadius: 24,
            padding: "40px 28px",
            background: "#fafbfc",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: 40, animation: `fadeInUp 0.5s ease-out` }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: 28, 
              color: "#111827",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}>
              Pesan {currentService.label} sekarang
            </h2>
            <p style={{ 
              margin: "12px 0 0", 
              color: "#64748b", 
              lineHeight: 1.6,
              fontSize: 14,
              fontWeight: 500,
            }}>
              Ceritakan kebutuhan mu dengan singkat dan jelas.
            </p>
          </div>

          {/* Conversational Pickup & Drop */}
          <ConversationalInputSection
            form={form}
            errors={errors}
            handleChange={handleChange}
            extraStops={extraStops}
            setExtraStops={setExtraStops}
            getCurrentLocationForExtraStop={getCurrentLocationForExtraStop}
            openMapPickerForExtraStop={openMapPickerForExtraStop}
            needsRecipient={needsRecipient}
            preview={preview}
            previewLoading={previewLoading}
          />

          {/* Price Preview Card */}
          <PricePreviewCard preview={preview} previewLoading={previewLoading} />

          {/* Optional Catatan Section */}
          <OptionalCatatan 
            form={form}
            handleChange={handleChange}
          />

          {/* Error Message */}
          {feedback ? (
            <div
              style={{
                marginTop: 24,
                padding: 14,
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.08)",
                color: "#991b1b",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontSize: 13,
                lineHeight: 1.5,
                animation: `fadeInUp 0.3s ease-out`,
              }}
            >
              ✕ {feedback}
            </div>
          ) : null}

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: 32,
              width: "100%",
              border: "none",
              borderRadius: 12,
              padding: "18px 24px",
              background: "#111827",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.3s ease",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.background = "#0f172a";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#111827";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {isSubmitting ? "⏳ Mengirim..." : "Pesan Sekarang"}
          </button>
        </form>
      </div>

      <MapPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={(address, lat, lng) => {
          if (currentMapField.startsWith("extra_stop_")) {
            const index = parseInt(currentMapField.split("_")[2]);
            setExtraStops((prev) => {
              const newStops = [...prev];
              newStops[index] = address;
              return newStops;
            });
          } else {
            setForm((prev) => ({
              ...prev,
              [currentMapField]: address,
              [`${currentMapField}_lat`]: lat,
              [`${currentMapField}_lng`]: lng,
            }));
          }
        }}
        mapCenter={mapCenter}
        title="Pilih Lokasi di Peta"
      />
    </div>
  );
}

// 🔥 LEAFLET MAP PICKER COMPONENT
const MapPickerModal = ({ isOpen, onClose, onSelectLocation, mapCenter, title }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [selectedLat, setSelectedLat] = useState(mapCenter[0]);
  const [selectedLng, setSelectedLng] = useState(mapCenter[1]);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Fix Leaflet default icon path
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });
  }, []);

  // 🔥 AUTO GET CURRENT LOCATION WHEN MODAL OPENS
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setSelectedLat(lat);
          setSelectedLng(lng);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([selectedLat, selectedLng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Clear existing marker
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    // Add draggable marker
    marker.current = L.marker([selectedLat, selectedLng], { draggable: true })
      .addTo(map.current);

    const updateMarkerPosition = () => {
      const pos = marker.current.getLatLng();
      setSelectedLat(pos.lat);
      setSelectedLng(pos.lng);
    };

    marker.current.on("dragend", updateMarkerPosition);
    map.current.on("click", (e) => {
      marker.current.setLatLng(e.latlng);
      updateMarkerPosition();
    });

    // Update view
    map.current.setView([selectedLat, selectedLng], 16);

    return () => {
      if (map.current && marker.current) {
        marker.current.off("dragend");
        map.current.off("click");
      }
    };
  }, [isOpen, mapCenter, selectedLat, selectedLng]);

  // Reverse geocoding to get address
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleSelectLocation = async () => {
    const address = await getAddressFromCoords(selectedLat, selectedLng);
    onSelectLocation(address, selectedLat, selectedLng);
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    if (userLat && userLng) {
      const address = await getAddressFromCoords(userLat, userLng);
      onSelectLocation(address, userLat, userLng);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.70)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 600,
          height: "80%",
          borderRadius: 28,
          background: "rgba(255,255,255,0.98)",
          padding: 24,
          boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            border: "none",
            background: "#f1f5f9",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 18,
            fontWeight: "bold",
            color: "#64748b",
          }}
        >
          ×
        </button>

        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
          {title || "Pilih Lokasi"}
        </div>

        <div
          ref={mapContainer}
          style={{
            flex: 1,
            borderRadius: 16,
            marginBottom: 16,
            border: "2px solid #e2e8f0",
          }}
        />

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            📍 Lat: {selectedLat.toFixed(6)} | Lng: {selectedLng.toFixed(6)}
          </div>
          {userLat && userLng && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              📌 Lokasi Anda: {userLat.toFixed(6)}, {userLng.toFixed(6)}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {userLat && userLng && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              style={{
                width: "100%",
                border: "2px solid #3b82f6",
                borderRadius: 22,
                padding: "16px 20px",
                background: "#f0f9ff",
                color: "#1e40af",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              📍 Gunakan Lokasi Saya
            </button>
          )}

          <button
            type="button"
            onClick={handleSelectLocation}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 22,
              padding: "16px 20px",
              background: "linear-gradient(135deg, #111827, #334155)",
              color: "#f8fafc",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✓ Pilih Lokasi Ini
          </button>
        </div>
      </div>
    </div>
  );
};

// 🎨 CONVERSATIONAL INPUT SECTION COMPONENT
const ConversationalInputSection = ({ 
  form, 
  errors, 
  handleChange, 
  extraStops, 
  setExtraStops,
  getCurrentLocationForExtraStop,
  openMapPickerForExtraStop,
  needsRecipient,
  preview,
  previewLoading,
}) => {
  const pickupRef = useRef(null);
  const dropRef = useRef(null);
  const itemRef = useRef(null);

  const handlePickupComplete = (e) => {
    if (form.pickup_location.trim() && form.drop_location.trim()) {
      // Both filled, focus stays
    } else if (form.pickup_location.trim()) {
      dropRef.current?.focus();
    }
  };

  const handleDropComplete = (e) => {
    if (form.drop_location.trim()) {
      itemRef.current?.focus();
    }
  };

  return (
    <div style={{ marginBottom: 40, animation: `fadeInUp 0.6s ease-out` }}>
      {/* Pickup Input */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 24,
        padding: "16px 0",
        borderBottom: errors.pickup_location ? "2px solid #ef4444" : "2px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500, minWidth: "auto" }}>
          📍 Saya dijemput di
        </span>
        <input
          ref={pickupRef}
          type="text"
          value={form.pickup_location}
          onChange={(e) => handleChange("pickup_location", e.target.value)}
          onBlur={handlePickupComplete}
          placeholder="lokasi jemput..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: "#111827",
            fontSize: 16,
            fontWeight: 500,
            padding: "0",
          }}
          onFocus={(e) => {
            e.currentTarget.parentElement.style.borderBottomColor = "#111827";
            e.currentTarget.parentElement.style.background = "rgba(248, 250, 252, 0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.parentElement.style.borderBottomColor = errors.pickup_location ? "#ef4444" : "transparent";
            e.currentTarget.parentElement.style.background = "transparent";
          }}
        />
      </div>
      {errors.pickup_location && (
        <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 16, marginLeft: 8 }}>
          ✕ {errors.pickup_location}
        </div>
      )}

      {/* Drop Input */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 24,
        padding: "16px 0",
        borderBottom: errors.drop_location ? "2px solid #ef4444" : "2px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500, minWidth: "auto" }}>
          📌 dan ingin pergi ke
        </span>
        <input
          ref={dropRef}
          type="text"
          value={form.drop_location}
          onChange={(e) => handleChange("drop_location", e.target.value)}
          onBlur={handleDropComplete}
          placeholder="lokasi tujuan..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: "#111827",
            fontSize: 16,
            fontWeight: 500,
            padding: "0",
          }}
          onFocus={(e) => {
            e.currentTarget.parentElement.style.borderBottomColor = "#111827";
            e.currentTarget.parentElement.style.background = "rgba(248, 250, 252, 0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.parentElement.style.borderBottomColor = errors.drop_location ? "#ef4444" : "transparent";
            e.currentTarget.parentElement.style.background = "transparent";
          }}
        />
      </div>
      {errors.drop_location && (
        <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 16, marginLeft: 8 }}>
          ✕ {errors.drop_location}
        </div>
      )}

      {/* Item & Quantity - Only show if both pickup and drop are filled */}
      {form.pickup_location && form.drop_location && (
        <div style={{
          animation: `fadeInUp 0.4s ease-out`,
          marginBottom: 24,
        }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 24,
            padding: "16px 0",
            borderBottom: "2px solid transparent",
            transition: "all 0.3s ease",
          }}>
            <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500, minWidth: "auto" }}>
              📦 saya akan membawa
            </span>
            <input
              ref={itemRef}
              type="text"
              value={form.item_name}
              onChange={(e) => handleChange("item_name", e.target.value)}
              placeholder="apa yang dibawa..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#111827",
                fontSize: 16,
                fontWeight: 500,
                padding: "0",
              }}
              onFocus={(e) => {
                e.currentTarget.parentElement.style.borderBottomColor = "#111827";
                e.currentTarget.parentElement.style.background = "rgba(248, 250, 252, 0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.parentElement.style.borderBottomColor = "transparent";
                e.currentTarget.parentElement.style.background = "transparent";
              }}
            />
          </div>

          {/* Recipient Fields - Only for kurir, gift, travel */}
          {needsRecipient && (
            <div style={{ animation: `fadeInUp 0.4s ease-out`, marginBottom: 24 }}>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 16,
                padding: "16px 0",
                borderBottom: errors.recipient_name ? "2px solid #ef4444" : "2px solid transparent",
                transition: "all 0.3s ease",
              }}>
                <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500, minWidth: "auto" }}>
                  👤 untuk
                </span>
                <input
                  type="text"
                  value={form.recipient_name}
                  onChange={(e) => handleChange("recipient_name", e.target.value)}
                  placeholder="nama penerima..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "0",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement.style.borderBottomColor = "#111827";
                    e.currentTarget.parentElement.style.background = "rgba(248, 250, 252, 0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement.style.borderBottomColor = errors.recipient_name ? "#ef4444" : "transparent";
                    e.currentTarget.parentElement.style.background = "transparent";
                  }}
                />
              </div>
              {errors.recipient_name && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 16, marginLeft: 8 }}>
                  ✕ {errors.recipient_name}
                </div>
              )}

              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 0,
                padding: "16px 0",
                borderBottom: errors.recipient_phone ? "2px solid #ef4444" : "2px solid transparent",
                transition: "all 0.3s ease",
              }}>
                <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500, minWidth: "auto" }}>
                  ☎️
                </span>
                <input
                  type="text"
                  value={form.recipient_phone}
                  onChange={(e) => handleChange("recipient_phone", e.target.value)}
                  placeholder="nomor penerima..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "0",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement.style.borderBottomColor = "#111827";
                    e.currentTarget.parentElement.style.background = "rgba(248, 250, 252, 0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement.style.borderBottomColor = errors.recipient_phone ? "#ef4444" : "transparent";
                    e.currentTarget.parentElement.style.background = "transparent";
                  }}
                />
              </div>
              {errors.recipient_phone && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 0, marginLeft: 8 }}>
                  ✕ {errors.recipient_phone}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extra Stops - Compact version */}
      {form.pickup_location && form.drop_location && (
        <div style={{
          animation: `fadeInUp 0.5s ease-out`,
          marginBottom: 0,
          padding: "16px 0",
          borderTop: "1px solid #e2e8f0",
        }}>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setExtraStops([...extraStops, ""])}
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 8,
                padding: "10px 12px",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(248, 250, 252, 0.8)";
                e.target.style.borderColor = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "#cbd5e1";
              }}
            >
              + Tambah stop lagi
            </button>
          </div>

          {extraStops.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {extraStops.map((stop, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ color: "#cbd5e1", fontWeight: 600 }}>⋮⋮</span>
                  <input
                    type="text"
                    value={stop}
                    onChange={(e) => {
                      const newStops = [...extraStops];
                      newStops[index] = e.target.value;
                      setExtraStops(newStops);
                    }}
                    placeholder="stop berikutnya..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#111827",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => getCurrentLocationForExtraStop(index)}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "4px 6px",
                      background: "transparent",
                      color: "#111827",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    📍
                  </button>
                  <button
                    type="button"
                    onClick={() => openMapPickerForExtraStop(index)}
                    style={{
                      border: "1px solid #10b981",
                      borderRadius: 6,
                      padding: "4px 6px",
                      background: "#f0fdf4",
                      color: "#10b981",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    🗺️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newStops = extraStops.filter((_, i) => i !== index);
                      setExtraStops(newStops);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 💰 PRICE PREVIEW CARD COMPONENT
const PricePreviewCard = ({ preview, previewLoading }) => {
  if (!preview && !previewLoading) return null;

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 20,
        borderRadius: 12,
        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        border: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        animation: `fadeInUp 0.5s ease-out`,
        transition: "all 0.3s ease",
      }}
    >
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
          Harga Perkiraan
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginTop: 6 }}>
          {previewLoading ? "..." : preview ? currency(preview.total_price) : "—"}
        </div>
      </div>
      <div style={{ textAlign: "right", fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
        <div>🚀 {preview?.summary || "Isi lokasi untuk melihat harga"}</div>
      </div>
    </div>
  );
};

// ✍️ OPTIONAL CATATAN COMPONENT
const OptionalCatatan = ({ form, handleChange }) => {
  const [showCatatan, setShowCatatan] = useState(false);

  return (
    <div style={{ marginBottom: 28 }}>
      {!showCatatan ? (
        <button
          type="button"
          onClick={() => setShowCatatan(true)}
          style={{
            border: "none",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#111827";
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "#64748b";
            e.target.style.textDecoration = "none";
          }}
        >
          + Tambah catatan
        </button>
      ) : (
        <div style={{ animation: `fadeInUp 0.3s ease-out` }}>
          <textarea
            value={form.note}
            onChange={(e) => handleChange("note", e.target.value)}
            placeholder="Tulis catatan atau instruksi khusus di sini..."
            style={{
              width: "100%",
              border: "none",
              borderBottom: "2px solid #e2e8f0",
              outline: "none",
              background: "transparent",
              color: "#111827",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 0",
              minHeight: 80,
              resize: "none",
              fontFamily: "inherit",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = "#111827";
              e.target.style.background = "rgba(248, 250, 252, 0.5)";
              e.target.style.padding = "12px";
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = "#e2e8f0";
              e.target.style.background = "transparent";
              e.target.style.padding = "12px 0";
            }}
          />
        </div>
      )}
    </div>
  );
};

function Field({ label, error, multiline = false, onChange, index = 0, ...props }) {
  const sharedStyle = {
    width: "100%",
    padding: multiline ? "16px 0" : "12px 0",
    borderRadius: 0,
    border: "none",
    borderBottom: error ? "2px solid #ef4444" : "1px solid #d1d5db",
    background: "transparent",
    outline: "none",
    color: "#111827",
    boxSizing: "border-box",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  };

  return (
    <label 
      style={{ 
        display: "grid", 
        gap: 8,
        animation: `fadeInUp 0.5s ease-out forwards`,
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
      }}
    >
      <span style={{ 
        fontWeight: 500, 
        color: "#4b5563", 
        fontSize: 13,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={4}
          {...props}
          onChange={(event) => onChange(event.target.value)}
          style={{ 
            ...sharedStyle, 
            resize: "none",
            minHeight: 80,
            paddingRight: 8,
          }}
          onFocus={(e) => {
            e.target.style.borderBottomColor = "#111827";
            e.target.style.background = "rgba(248, 250, 252, 0.5)";
          }}
          onBlur={(e) => {
            e.target.style.borderBottomColor = error ? "#ef4444" : "#d1d5db";
            e.target.style.background = "transparent";
          }}
        />
      ) : (
        <input
          {...props}
          onChange={(event) => onChange(event.target.value)}
          style={sharedStyle}
          onFocus={(e) => {
            e.target.style.borderBottomColor = "#111827";
            e.target.style.background = "rgba(248, 250, 252, 0.5)";
            e.target.style.borderBottomWidth = "2px";
          }}
          onBlur={(e) => {
            e.target.style.borderBottomColor = error ? "#ef4444" : "#d1d5db";
            e.target.style.background = "transparent";
            e.target.style.borderBottomWidth = "1px";
          }}
        />
      )}
      {error ? (
        <span style={{ 
          color: "#ef4444", 
          fontSize: 12,
          animation: `fadeIn 0.3s ease-out`,
        }}>
          ✕ {error}
        </span>
      ) : null}
    </label>
  );
}

