import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

const SERVICE_OPTIONS = [
  { value: "delivery", label: "Delivery Order", description: "Belanja, makanan, dan kebutuhan harian", icon: "📦", accent: "#d7b56d" },
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
  const [selectedService, setSelectedService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    service_type: "delivery",
    pickup_location: "",
    drop_location: "",
    recipient_name: "",
    recipient_phone: "",
    item_name: PRESET_TEMPLATE.delivery.item_name,
    quantity: 1,
    unit_price: 0,
    note: PRESET_TEMPLATE.delivery.note,
    extra_stops_text: ""
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    if (!form.pickup_location.trim() || !form.drop_location.trim()) {
      setPreview(null);
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
      } catch (err) {
        console.error(err);
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
      pickup_location: "",
      drop_location: "",
      recipient_name: user?.name || "",
      recipient_phone: user?.phone || "",
      item_name: preset.item_name,
      quantity: 1,
      unit_price: 0,
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
    if (!form.pickup_location.trim()) next.pickup_location = "Lokasi jemput wajib diisi.";
    if (!form.drop_location.trim()) next.drop_location = "Lokasi tujuan wajib diisi.";
    if (["kurir", "gift", "travel"].includes(form.service_type) && !form.recipient_name.trim()) next.recipient_name = "Nama penerima wajib diisi.";
    if (["kurir", "gift", "travel"].includes(form.service_type) && !form.recipient_phone.trim()) next.recipient_phone = "Nomor penerima wajib diisi.";
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
        extra_stops: extraStops
      });
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
      padding: "20px 16px 110px",
      background: "radial-gradient(circle at top left, rgba(215,181,109,0.18), transparent 28%), radial-gradient(circle at top right, rgba(125,211,252,0.15), transparent 25%), linear-gradient(180deg, #0b1020 0%, #111827 45%, #f5efe2 46%, #f7f2ea 100%)",
      color: "#111827"
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={{
          borderRadius: 30,
          padding: 24,
          background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
          color: "#f8fafc",
          boxShadow: "0 28px 70px rgba(2, 6, 23, 0.45)"
        }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.72 }}>
            Jojo App
          </div>
          <h1 style={{ margin: "14px 0 8px", fontSize: 30, lineHeight: 1.05 }}>
            Pilih layanan, isi form popup, dan langsung submit.
          </h1>
          <p style={{ margin: 0, color: "rgba(226,232,240,0.78)", lineHeight: 1.6 }}>
            {user?.name ? `Halo ${user.name}, ` : ""}semua layanan sekarang dibuka dengan modal form premium. Anti ribet, cepat, dan jelas.
          </p>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {['Popup Form', 'Langsung Pilih', 'Tanpa Chatbot'].map((tag) => (
              <div key={tag} style={{ borderRadius: 18, padding: '12px 10px', background: 'rgba(255,255,255,0.08)', fontSize: 12, textAlign: 'center' }}>{tag}</div>
            ))}
          </div>
        </section>

        <section style={{
          borderRadius: 28,
          padding: 18,
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 18px 44px rgba(15,23,42,0.10)"
        }}>
          <div style={{ display: "grid", gap: 16 }}>
            {SERVICE_OPTIONS.map((service, index) => (
              <button
                key={service.value}
                type="button"
                onClick={() => openServiceForm(service)}
                onMouseEnter={() => setServiceHovered(index)}
                onMouseLeave={() => setServiceHovered(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 14,
                  alignItems: 'center',
                  width: '100%',
                  textAlign: 'left',
                  padding: 18,
                  borderRadius: 24,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: serviceHovered === index ? `${service.accent}14` : '#ffffff',
                  boxShadow: serviceHovered === index ? `0 18px 34px ${service.accent}22` : '0 4px 16px rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 18, display: 'grid', placeItems: 'center', background: service.accent, color: '#0f172a', fontSize: 22 }}>
                  {service.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{service.label}</div>
                  <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>{service.description}</div>
                </div>
                <div style={{ fontSize: 22, color: service.accent }}>→</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {showForm && selectedService ? (
        <div
          className="popup-enter"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 11, 28, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            padding: 16
          }}
          onClick={closeForm}
        >
          <div
            style={{
              width: 'min(100%, 520px)',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              background: '#0a1324',
              borderRadius: 32,
              padding: 24,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              position: 'relative',
              border: `1px solid ${selectedAccent}33`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeForm}
              style={{
                position: 'absolute',
                right: 18,
                top: 18,
                border: 'none',
                background: '#11243b',
                color: '#e2e8f0',
                borderRadius: '50%',
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 18
              }}
            >
              ×
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 20, background: `${selectedAccent}22`, display: 'grid', placeItems: 'center', fontSize: 26, color: '#fff' }}>
                {selectedService.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{selectedService.label}</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>{selectedService.description}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <Field label="Lokasi Jemput" value={form.pickup_location} onChange={(value) => handleChange('pickup_location', value)} error={errors.pickup_location} placeholder="Contoh: Jl. Sudirman No. 12" />
                <Field label="Lokasi Tujuan" value={form.drop_location} onChange={(value) => handleChange('drop_location', value)} error={errors.drop_location} placeholder="Contoh: Grand Indonesia" />
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <Field label="Nama Item / Keperluan" value={form.item_name} onChange={(value) => handleChange('item_name', value)} placeholder="Contoh: Paket dokumen / order belanja" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Quantity" type="number" value={form.quantity} onChange={(value) => handleChange('quantity', value)} placeholder="1" />
                  <Field label="Budget per item" type="number" value={form.unit_price} onChange={(value) => handleChange('unit_price', value)} placeholder="0" />
                </div>
              </div>

              {["kurir", "gift", "travel"].includes(form.service_type) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Nama Penerima" value={form.recipient_name} onChange={(value) => handleChange('recipient_name', value)} error={errors.recipient_name} placeholder="Nama penerima" />
                  <Field label="Nomor Penerima" value={form.recipient_phone} onChange={(value) => handleChange('recipient_phone', value)} error={errors.recipient_phone} placeholder="08xxxxxxxxxx" />
                </div>
              )}

              <Field label="Titik Tambahan" multiline value={form.extra_stops_text} onChange={(value) => handleChange('extra_stops_text', value)} placeholder="Satu alamat per baris" />
              <Field label="Catatan Eksekusi" multiline value={form.note} onChange={(value) => handleChange('note', value)} placeholder="Instruksi singkat yang jelas" />

              <div style={{ padding: 18, borderRadius: 24, background: '#111827', border: `1px solid ${selectedAccent}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>Preview</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{preview ? formatRupiah(preview.total_price) : 'Estimasi otomatis'}</div>
                    <div style={{ color: '#cbd5e1', marginTop: 6 }}>{previewLoading ? 'Menghitung estimasi...' : preview?.summary || 'Isi pickup dan tujuan untuk melihat preview.'}</div>
                  </div>
                  <div style={{ minWidth: 100, borderRadius: 20, padding: 14, background: '#0f172a', color: '#f8fafc', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Stop</div>
                    <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{extraStops.length ? extraStops.length + 1 : 1}</div>
                  </div>
                </div>
              </div>

              {feedback ? (
                <div style={{ padding: 14, borderRadius: 18, background: 'rgba(220,38,38,0.10)', color: '#f8d7da' }}>{feedback}</div>
              ) : null}

              <button type="submit" disabled={isSubmitting} style={{ width: '100%', border: 'none', borderRadius: 22, padding: '18px 20px', background: `linear-gradient(135deg, ${selectedAccent}, #1f2937)`, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {isSubmitting ? 'Mengirim order...' : 'Kirim Order Premium'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, error, multiline = false, onChange, ...props }) {
  const sharedStyle = {
    width: '100%',
    padding: '16px 18px',
    borderRadius: 18,
    border: error ? '1px solid rgba(248, 113, 113, 0.6)' : '1px solid rgba(148,163,184,0.22)',
    background: '#f8fafc',
    outline: 'none',
    color: '#0f172a',
    boxSizing: 'border-box',
    fontSize: 14
  };

  return (
    <label style={{ display: 'grid', gap: 8, color: '#0f172a' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {multiline ? (
        <textarea rows={4} {...props} onChange={(event) => onChange(event.target.value)} style={{ ...sharedStyle, resize: 'vertical', minHeight: 112 }} />
      ) : (
        <input {...props} onChange={(event) => onChange(event.target.value)} style={sharedStyle} />
      )}
      {error ? <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span> : null}
    </label>
  );
}
'''
with open('Home.temp.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('written')
PY