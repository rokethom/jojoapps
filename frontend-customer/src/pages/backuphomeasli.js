import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

const SERVICE_OPTIONS = [
  { value: "delivery", label: "Delivery Order", description: "Belanja, makanan, kebutuhan harian", icon: "📦", accent: "#d7b56d" },
  { value: "ojek", label: "Ojek", description: "Perjalanan cepat dan nyaman", icon: "🏍️", accent: "#7dd3fc" },
  { value: "kurir", label: "Kurir", description: "Pengiriman barang penting dengan penerima jelas", icon: "📮", accent: "#86efac" },
  { value: "belanja", label: "Belanja", description: "Shopping assistant untuk kebutuhan Anda", icon: "🛒", accent: "#fdba74" },
  { value: "gift", label: "Gift Order", description: "Hadiah spesial dengan sentuhan personal", icon: "🎁", accent: "#f9a8d4" },
  { value: "epajak", label: "Epajak", description: "Layanan pajak digital dengan dokumen aman", icon: "📋", accent: "#a78bfa" },
  { value: "etilang", label: "Etilang", description: "Pengurusan tilang cepat dan resmi", icon: "🚗", accent: "#fb7185" },
  { value: "travel", label: "Travel", description: "Perjalanan aman dengan paket lengkap", icon: "✈️", accent: "#38bdf8" },
  { value: "joker_mobil", label: "Joker Mobil", description: "Rental mobil fleksibel dan cepat", icon: "🏎️", accent: "#fbbf24" }
];

const PRESET_TEMPLATE = {
  delivery: {
    item_name: "Belanja cepat",
    note: "Tuliskan daftar belanja dan detail preferensi produk."
  },
  ojek: {
    item_name: "Perjalanan singkat",
    note: "Tuliskan lokasi penjemputan dan tujuan dengan jelas."
  },
  kurir: {
    item_name: "Dokumen / Paket Penting",
    note: "Sebutkan nama penerima, nomor kontak, dan jenis barang."
  },
  belanja: {
    item_name: "Titip Belanja",
    note: "Jelaskan item belanja, jumlah, dan toko tujuan."
  },
  gift: {
    item_name: "Gift Delivery",
    note: "Sebutkan hadiah, penerima, dan pesan khusus."
  },
  epajak: {
    item_name: "Form Pajak",
    note: "Isi data dokumen, jenis pajak, dan batas waktu jika ada."
  },
  etilang: {
    item_name: "Form Etilang",
    note: "Tuliskan jenis pelanggaran, nomor STNK, dan data pelapor."
  },
  travel: {
    item_name: "Form Travel",
    note: "Isi tujuan perjalanan, durasi, dan preferensi transportasi."
  },
  joker_mobil: {
    item_name: "Rental Mobil",
    note: "Pilih tipe mobil, lama rental, dan layanan driver."
  }
};

export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [user, setUser] = useState({});
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [serviceHovered, setServiceHovered] = useState(null);
  const [menuHovered, setMenuHovered] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    service_type: "delivery",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    pickup_address: "",
    drop_address: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_address: "",
    item_a: "",
    item_b: "",
    item_c: "",
    item_type: "",
    item_price: "",
    item_weight: "",
    item_option: "",
    purchase_address: "",
    purchase_area: "",
    price_service: "",
    note: PRESET_TEMPLATE.delivery.note,
    extra_stops_text: ""
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [computedPrice, setComputedPrice] = useState("");

  useEffect(() => {
    const tokenStored = localStorage.getItem("access");
    if (tokenStored) fetchProfile();

    const style = document.createElement("style");
    style.textContent = `
      @keyframes characterFallIn { 0% { opacity: 0; transform: translateY(-50px) rotateX(90deg); } 100% { opacity: 1; transform: translateY(0) rotateX(0); } }
      @keyframes typingEffect { 0% { width: 0; } 100% { width: 100%; } }
      @keyframes slideInUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes menuCardLift { 0% { box-shadow: 0 2px 8px rgba(0,0,0,0.05); } 100% { box-shadow: 0 16px 32px rgba(0,0,0,0.18); } }
      @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      @keyframes bounce { 0%, 20%, 50%, 53%, 80%, 100% { transform: translateY(0); } 40%, 43% { transform: translateY(-6px); } 70% { transform: translateY(-3px); } }
      @keyframes waveMotion { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(10px) translateY(-5px); } }
      .greeting-char { display: inline-block; animation: characterFallIn 0.8s cubic-bezier(0.4,0,0.2,1) forwards; opacity: 0; }
      .banner-text { overflow: hidden; white-space: nowrap; animation: typingEffect 3s steps(40,end); }
      .service-card { transition: all 0.25s ease; transform-style: preserve-3d; }
      .service-card:hover { animation: menuCardLift 0.3s ease-in-out; transform: translateY(-8px); }
      .popup-enter { animation: slideInUp 0.35s cubic-bezier(0.4,0,0.2,1); }
    `;
    document.head.appendChild(style);

    setTimeout(() => setGreetingVisible(true), 200);
    const bannerMessage = "Order layanan Jojo kini langsung dari home dengan form popup premium.";
    let i = 0;
    const typeWriter = () => {
      if (i < bannerMessage.length) {
        setBannerText(bannerMessage.slice(0, i + 1));
        i++;
        setTimeout(typeWriter, 45);
      }
    };
    setTimeout(typeWriter, 500);

    return () => document.head.removeChild(style);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get("/auth/me/");
      setUser(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const extraStops = useMemo(
    () => form.extra_stops_text.split("\n").map((item) => item.trim()).filter(Boolean),
    [form.extra_stops_text]
  );

  useEffect(() => {
    const canPreview = () => {
      if (form.service_type === "ojek") {
        return form.pickup_address.trim() && form.drop_address.trim();
      }
      if (form.service_type === "delivery" || form.service_type === "belanja") {
        return form.customer_address.trim() && form.purchase_address.trim() && form.purchase_area.trim();
      }
      if (form.service_type === "kurir") {
        return form.customer_address.trim() && form.recipient_name.trim() && form.recipient_phone.trim() && form.recipient_address.trim() && form.item_type.trim();
      }
      return false;
    };

    if (!canPreview()) {
      setPreview(null);
      setComputedPrice("");
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await API.post("/orders/service-preview/", {
          ...form,
          extra_stops: extraStops
        });
        setPreview(res.data);
        setComputedPrice(res.data?.price ? String(res.data.price) : res.data?.total_price ? String(res.data.total_price) : "");
      } catch (err) {
        console.error(err);
        setComputedPrice("");
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form, extraStops]);

  const openServiceForm = (service) => {
    const tokenStored = token || localStorage.getItem("access");
    if (!tokenStored) {
      navigate("/login");
      return;
    }

    const preset = PRESET_TEMPLATE[service.value] || PRESET_TEMPLATE.delivery;
    setSelectedService(service);
    setForm({
      service_type: service.value,
      customer_name: user?.name || "",
      customer_phone: user?.phone || "",
      customer_address: "",
      pickup_address: "",
      drop_address: "",
      recipient_name: "",
      recipient_phone: "",
      recipient_address: "",
      item_a: "",
      item_b: "",
      item_c: "",
      item_type: "",
      item_price: "",
      item_weight: "",
      item_option: "",
      purchase_address: "",
      purchase_area: "",
      price_service: "",
      note: preset.note,
      extra_stops_text: ""
    });
    setErrors({});
    setFeedback("");
    setPreview(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedService(null);
    setErrors({});
    setFeedback("");
  };

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFeedback("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.customer_name.trim()) next.customer_name = "Nama wajib diisi.";
    if (!form.customer_phone.trim()) next.customer_phone = "Hp / WhatsApp wajib diisi.";

    if (form.service_type === "delivery" || form.service_type === "belanja") {
      if (!form.customer_address.trim()) next.customer_address = "Alamat wajib diisi.";
      if (!form.purchase_address.trim()) next.purchase_address = "Alamat pembelian wajib diisi.";
      if (!form.purchase_area.trim()) next.purchase_area = "Area wajib diisi.";
      if (!computedPrice.trim()) next.price_service = "Harga jasa.....";
    }

    if (form.service_type === "ojek") {
      if (!form.pickup_address.trim()) next.pickup_address = "Alamat jemput wajib diisi.";
      if (!form.drop_address.trim()) next.drop_address = "Alamat antar wajib diisi.";
      if (!computedPrice.trim()) next.price_service = "Harga jasa.....";
    }

    if (form.service_type === "kurir") {
      if (!form.customer_address.trim()) next.customer_address = "Alamat pengirim wajib diisi.";
      if (!form.recipient_name.trim()) next.recipient_name = "Nama penerima wajib diisi.";
      if (!form.recipient_phone.trim()) next.recipient_phone = "HP/WA penerima wajib diisi.";
      if (!form.recipient_address.trim()) next.recipient_address = "Alamat penerima wajib diisi.";
      if (!form.item_type.trim()) next.item_type = "Jenis barang wajib diisi.";
      if (!form.item_weight.trim()) next.item_weight = "Perkiraan berat wajib diisi.";
      if (!form.item_option.trim()) next.item_option = "Opsi layanan wajib diisi.";
      if (!computedPrice.trim()) next.price_service = "Harga jasa.....";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback("");

    try {
      await API.post("/orders/service-create/", {
        ...form,
        price_service: computedPrice,
        extra_stops: extraStops
      });
      setShowForm(false);
      navigate("/history");
    } catch (err) {
      console.error(err);
      setErrors(err.response?.data?.errors || {});
      setFeedback(err.response?.data?.detail || "Order gagal dibuat. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (value) => `Rp${new Intl.NumberFormat("id-ID").format(value || 0)}`;
  const selectedAccent = selectedService?.accent || "#667eea";

  return (
    <div style={{
      minHeight: "100vh",
      padding: "18px 16px 110px",
      background: "radial-gradient(circle at top left, rgba(125,211,252,0.15), transparent 24%), radial-gradient(circle at top right, rgba(215,181,109,0.18), transparent 22%), linear-gradient(180deg, #081120 0%, #101827 42%, #f3eee4 42%, #f7f4ed 100%)"
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={{
          borderRadius: 30,
          padding: 24,
          background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.90))",
          color: "#f8fafc",
          boxShadow: "0 28px 70px rgba(2, 6, 23, 0.45)"
        }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.72 }}>
            Jojo App
          </div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {["Fast form", "Langsung submit", "Modal premium"].map((tag) => (
              <div key={tag} style={{ borderRadius: 18, padding: "12px 10px", background: "rgba(255,255,255,0.07)", fontSize: 12, textAlign: "center" }}>
                {tag}
              </div>
            ))}
          </div>
        </section>

        <section style={{
          borderRadius: 28,
          padding: 18,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 18px 44px rgba(15,23,42,0.10)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "#0f172a" }}>Pilih Layanan</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Pilih layanan untuk buka form langsung.</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {SERVICE_OPTIONS.map((service) => (
              <button
                key={service.value}
                type="button"
                onClick={() => openServiceForm(service)}
                onMouseEnter={() => setServiceHovered(service.value)}
                onMouseLeave={() => setServiceHovered(null)}
                style={{
                  border: "none",
                  borderRadius: 24,
                  padding: 18,
                  textAlign: "left",
                  background: `linear-gradient(135deg, ${service.accent}22, rgba(255,255,255,0.95))`,
                  boxShadow: serviceHovered === service.value ? "0 16px 35px rgba(15,23,42,0.18)" : "inset 0 0 0 1px rgba(148,163,184,0.16)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: serviceHovered === service.value ? "translateY(-2px)" : "none"
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{service.icon} {service.label}</div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{service.description}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {showForm && selectedService && (
        <div className="popup-enter" style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.70)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "24px 12px",
          overflowY: "auto",
          zIndex: 999
        }} onClick={closeForm}>
          <div style={{
            width: "min(96%, 520px)",
            maxHeight: "calc(100vh - 72px)",
            overflowY: "auto",
            borderRadius: 28,
            background: "rgba(255,255,255,0.98)",
            padding: 24,
            boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
            position: "relative",
            boxSizing: "border-box"
          }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeForm}
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
                color: "#64748b"
              }}
            >
              ×
            </button>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: selectedAccent }}>{selectedService.icon} {selectedService.label}</div>
              <div style={{ marginTop: 8, color: "#475569" }}>{selectedService.description}</div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                  Nama
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => handleChange("customer_name", e.target.value)}
                    placeholder="Nama lengkap"
                    style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                  />
                  {errors.customer_name && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_name}</span>}
                </label>

                <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                  Hp / WhatsApp
                  <input
                    type="text"
                    value={form.customer_phone}
                    onChange={(e) => handleChange("customer_phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                  />
                  {errors.customer_phone && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_phone}</span>}
                </label>

                {(form.service_type === "delivery" || form.service_type === "belanja") && (
                  <>
                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat
                      <input
                        type="text"
                        value={form.customer_address}
                        onChange={(e) => handleChange("customer_address", e.target.value)}
                        placeholder="Alamat lengkap"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.customer_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_address}</span>}
                    </label>

                    <div style={{ display: "grid", gap: 12 }}>
                      {["item_a", "item_b", "item_c"].map((field, index) => (
                        <label key={field} style={{ display: "grid", gap: 6, color: "#334155" }}>
                          Belikan {String.fromCharCode(97 + index)}
                          <input
                            type="text"
                            value={form[field]}
                            onChange={(e) => handleChange(field, e.target.value)}
                            placeholder={index === 0 ? "Contoh: 1 kg beras" : ""}
                            style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                          />
                        </label>
                      ))}
                    </div>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat pembelian
                      <input
                        type="text"
                        value={form.purchase_address}
                        onChange={(e) => handleChange("purchase_address", e.target.value)}
                        placeholder="Alamat tempat pembelian"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.purchase_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.purchase_address}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Area
                      <input
                        type="text"
                        value={form.purchase_area}
                        onChange={(e) => handleChange("purchase_area", e.target.value)}
                        placeholder="Area pembelian"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.purchase_area && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.purchase_area}</span>}
                    </label>
                  </>
                )}

                {form.service_type === "ojek" && (
                  <>
                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat Jemput
                      <input
                        type="text"
                        value={form.pickup_address}
                        onChange={(e) => handleChange("pickup_address", e.target.value)}
                        placeholder="Alamat lengkap jemput"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.pickup_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.pickup_address}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat Antar
                      <input
                        type="text"
                        value={form.drop_address}
                        onChange={(e) => handleChange("drop_address", e.target.value)}
                        placeholder="Alamat lengkap antar"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.drop_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.drop_address}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Titik Tambahan (Opsional)
                      <textarea
                        value={form.extra_stops_text}
                        onChange={(e) => handleChange("extra_stops_text", e.target.value)}
                        placeholder="Masukkan alamat tambahan per baris"
                        rows={3}
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%", resize: "vertical" }}
                      />
                    </label>
                  </>
                )}

                {form.service_type === "kurir" && (
                  <>
                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Nama Pengirim
                      <input
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => handleChange("customer_name", e.target.value)}
                        placeholder="Nama pengirim"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.customer_name && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_name}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      No HP Pengirim
                      <input
                        type="text"
                        value={form.customer_phone}
                        onChange={(e) => handleChange("customer_phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.customer_phone && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_phone}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat Pengirim
                      <input
                        type="text"
                        value={form.customer_address}
                        onChange={(e) => handleChange("customer_address", e.target.value)}
                        placeholder="Alamat lengkap pengirim"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.customer_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.customer_address}</span>}
                    </label>

                    <div style={{ padding: "16px", borderRadius: 18, background: "#f8fafc" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Detail penerima</div>
                      <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                        Nama Penerima
                        <input
                          type="text"
                          value={form.recipient_name}
                          onChange={(e) => handleChange("recipient_name", e.target.value)}
                          placeholder="Nama penerima"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                        />
                        {errors.recipient_name && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.recipient_name}</span>}
                      </label>

                      <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                        HP/WA Penerima
                        <input
                          type="text"
                          value={form.recipient_phone}
                          onChange={(e) => handleChange("recipient_phone", e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                        />
                        {errors.recipient_phone && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.recipient_phone}</span>}
                      </label>

                      <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                        Alamat Penerima
                        <input
                          type="text"
                          value={form.recipient_address}
                          onChange={(e) => handleChange("recipient_address", e.target.value)}
                          placeholder="Alamat lengkap penerima"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                        />
                        {errors.recipient_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.recipient_address}</span>}
                      </label>
                    </div>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Jenis barang
                      <input
                        type="text"
                        value={form.item_type}
                        onChange={(e) => handleChange("item_type", e.target.value)}
                        placeholder="Contoh: Dokumen / Paket"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.item_type && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.item_type}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Perkiraan berat
                      <input
                        type="text"
                        value={form.item_weight}
                        onChange={(e) => handleChange("item_weight", e.target.value)}
                        placeholder="Contoh: 2 kg / 3 liter"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.item_weight && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.item_weight}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Opsi layanan
                      <input
                        type="text"
                        value={form.item_option}
                        onChange={(e) => handleChange("item_option", e.target.value)}
                        placeholder="Contoh: Jemput / Antar / Dokumen"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.item_option && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.item_option}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Harga Barang
                      <input
                        type="text"
                        value={form.item_price}
                        onChange={(e) => handleChange("item_price", e.target.value)}
                        placeholder="Contoh: 50000"
                        style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%" }}
                      />
                      {errors.item_price && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.item_price}</span>}
                    </label>
                  </>
                )}

                {(form.service_type === "delivery" || form.service_type === "belanja" || form.service_type === "ojek" || form.service_type === "kurir") && (
                  <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                    Harga Jasa
                    <input
                      type="text"
                      value={computedPrice ? formatRupiah(Number(computedPrice)) : ""}
                      readOnly
                      placeholder={previewLoading ? "Menghitung harga..." : "Estimasi harga otomatis dari pricing engine"}
                      style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", width: "100%", background: "#f8fafc", color: "#0f172a" }}
                    />
                    {!computedPrice && !previewLoading && <span style={{ color: "#64748b", fontSize: 12 }}>Harga jasa diisi otomatis setelah detail terisi.</span>}
                    {errors.price_service && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.price_service}</span>}
                  </label>
                )}

                {preview && (
                  <div style={{ background: "#f8fafc", borderRadius: 20, padding: 16, color: "#334155" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview Estimasi</div>
                    {form.service_type === "ojek" && <div>Jemput: {form.pickup_address}</div>}
                    {form.service_type === "ojek" && <div>Antar: {form.drop_address}</div>}
                    {form.service_type !== "ojek" && <div>Alamat: {form.customer_address}</div>}
                    <div>Estimasi harga: {(preview?.price || preview?.total_price) ? formatRupiah(preview.price || preview.total_price) : "-"}</div>
                    {preview.service_fee_breakdown && preview.service_fee_breakdown.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Breakdown biaya:</div>
                        {preview.service_fee_breakdown.map((item, index) => (
                          <div key={index} style={{ fontSize: 12 }}>
                            Titik {item.titik}: Rp {item.fee}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {feedback && <div style={{ color: "#dc2626", fontSize: 13 }}>{feedback}</div>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 22,
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #111827, #334155)",
                    color: "#f8fafc",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isSubmitting ? "Memproses..." : "Kirim Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
