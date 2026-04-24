import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔥 HAVERSINE DISTANCE CALCULATION (CORRECT - all in radians)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km

  // Convert degrees to radians
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula:
  // a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
  // c = 2 × atan2(√a, √(1−a))
  // d = R × c
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
};

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

// 🔥 LEAFLET MAP PICKER COMPONENT
const MapPickerModal = ({ isOpen, onClose, onSelectLocation, mapCenter, title, favoriteLocations, onSaveFavorite }) => {
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
          // Fallback ke mapCenter jika GPS gagal
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

  const handleSaveFavorite = async () => {
    const address = await getAddressFromCoords(selectedLat, selectedLng);
    onSaveFavorite(address, selectedLat, selectedLng);
    alert("Lokasi disimpan ke favorit!");
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

          <button
            type="button"
            onClick={handleSaveFavorite}
            style={{
              width: "100%",
              border: "1px solid #10b981",
              borderRadius: 22,
              padding: "16px 20px",
              background: "#10b981",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⭐ Simpan ke Favorit
          </button>

          {favoriteLocations && favoriteLocations.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>📍 Lokasi Favorit</div>
              {favoriteLocations.map((fav, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSelectedLat(fav.lat);
                    setSelectedLng(fav.lng);
                    if (marker.current) {
                      marker.current.setLatLng([fav.lat, fav.lng]);
                    }
                    if (map.current) {
                      map.current.setView([fav.lat, fav.lng], 16);
                    }
                  }}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 12,
                    padding: "12px 16px",
                    background: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 12,
                    transition: "all 0.2s ease",
                  }}
                >
                  {fav.address}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    customer_address_lat: "",
    customer_address_lng: "",
    pickup_address: "",
    pickup_address_lat: "",
    pickup_address_lng: "",
    drop_address: "",
    drop_address_lat: "",
    drop_address_lng: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_address: "",
    recipient_address_lat: "",
    recipient_address_lng: "",
    item_a: "",
    item_b: "",
    item_c: "",
    item_type: "",
    item_price: "",
    item_weight: "",
    item_option: "",
    purchase_address: "",
    purchase_address_lat: "",
    purchase_address_lng: "",
    purchase_area: "",
    price_service: "",
    note: PRESET_TEMPLATE.delivery.note
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [computedPrice, setComputedPrice] = useState("");
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [currentMapField, setCurrentMapField] = useState("");
  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default

  // 🔥 GET CURRENT LOCATION
  const getCurrentLocation = (fieldName) => {
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

          setForm((prev) => ({
            ...prev,
            [fieldName]: address,
            [`${fieldName}_lat`]: lat,
            [`${fieldName}_lng`]: lng,
          }));
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

  useEffect(() => {
    const tokenStored = localStorage.getItem("access");
    if (tokenStored) {
      fetchProfile();
      fetchFavoriteLocations();
    }

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

  const fetchFavoriteLocations = async () => {
    try {
      const response = await API.get("/auth/favorite-locations/");
      setFavoriteLocations(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const [extraStops, setExtraStops] = useState([]);

  const extraStopsText = useMemo(
    () => extraStops.join("\n"),
    [extraStops]
  );

  useEffect(() => {
    const canPreview = () => {
      if (form.service_type === "ojek") {
        return form.pickup_address_lat && form.drop_address_lat;
      }
      if (form.service_type === "delivery" || form.service_type === "belanja") {
        return form.customer_address_lat && form.purchase_address_lat;
      }
      if (form.service_type === "kurir") {
        return form.customer_address_lat && form.recipient_address_lat;
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
        const payload = {
          service_type: form.service_type,
          customer_lat: form.customer_address_lat,
          customer_lng: form.customer_address_lng,
          pickup_lat: form.pickup_address_lat,
          pickup_lng: form.pickup_address_lng,
          drop_lat: form.drop_address_lat,
          drop_lng: form.drop_address_lng,
          recipient_lat: form.recipient_address_lat,
          recipient_lng: form.recipient_address_lng,
          purchase_lat: form.purchase_address_lat,
          purchase_lng: form.purchase_address_lng,
          extra_stops: extraStops
        };
        const res = await API.post("/orders/service-preview/", payload);
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

  useEffect(() => {
    setForm(prev => ({ ...prev, extra_stops_text: extraStopsText }));
  }, [extraStopsText]);

  const openMapPicker = (fieldName) => {
    setCurrentMapField(fieldName);
    const lat = form[`${fieldName}_lat`] || -6.2088;
    const lng = form[`${fieldName}_lng`] || 106.8456;
    setMapCenter([lat, lng]);
    setShowMapPicker(true);
  };

  // 🔥 OPEN MAP PICKER FOR EXTRA STOP
  const openMapPickerForExtraStop = (index) => {
    setCurrentMapField(`extra_stop_${index}`);
    setMapCenter([-6.2088, 106.8456]); // Default Jakarta
    setShowMapPicker(true);
  };

  const saveFavoriteLocation = async (address, lat, lng) => {
    try {
      await API.post("/auth/favorite-locations/", { address, lat, lng });
      fetchFavoriteLocations();
    } catch (err) {
      console.error(err);
    }
  };

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
      note: preset.note
    });
    setExtraStops([]);
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
      if (!form.customer_address_lat) next.customer_address = "Alamat wajib diisi dengan GPS.";
      if (!form.purchase_address_lat) next.purchase_address = "Alamat pembelian wajib diisi dengan GPS.";
      if (!computedPrice.trim()) next.price_service = "Harga jasa.....";
    }

    if (form.service_type === "ojek") {
      if (!form.pickup_address_lat) next.pickup_address = "Alamat jemput wajib diisi dengan GPS.";
      if (!form.drop_address_lat) next.drop_address = "Alamat antar wajib diisi dengan GPS.";
      if (!computedPrice.trim()) next.price_service = "Harga jasa.....";
    }

    if (form.service_type === "kurir") {
      if (!form.customer_address_lat) next.customer_address = "Alamat pengirim wajib diisi dengan GPS.";
      if (!form.recipient_name.trim()) next.recipient_name = "Nama penerima wajib diisi.";
      if (!form.recipient_phone.trim()) next.recipient_phone = "HP/WA penerima wajib diisi.";
      if (!form.recipient_address_lat) next.recipient_address = "Alamat penerima wajib diisi dengan GPS.";
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
      const payload = {
        ...form,
        extra_stops: extraStops
      };
      await API.post("/orders/service-create/", payload);
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={form.customer_address}
                          onChange={(e) => handleChange("customer_address", e.target.value)}
                          placeholder="Alamat lengkap"
                          style={{
                            flex: 1,
                            borderRadius: 16,
                            border: "1px solid #d1d5db",
                            padding: "14px 16px"
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => getCurrentLocation("customer_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          📍
                        </button>

                        <button
                          type="button"
                          onClick={() => openMapPicker("customer_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          🗺️
                        </button>
                      </div>
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={form.purchase_address}
                          onChange={(e) => handleChange("purchase_address", e.target.value)}
                          placeholder="Alamat tempat pembelian"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", flex: 1 }}
                        />

                        <button
                          type="button"
                          onClick={() => getCurrentLocation("purchase_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          📍
                        </button>

                        <button
                          type="button"
                          onClick={() => openMapPicker("purchase_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          🗺️
                        </button>
                      </div>
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={form.pickup_address}
                          onChange={(e) => handleChange("pickup_address", e.target.value)}
                          placeholder="Alamat lengkap jemput"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", flex: 1 }}
                        />

                        <button
                          type="button"
                          onClick={() => getCurrentLocation("pickup_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          📍
                        </button>

                        <button
                          type="button"
                          onClick={() => openMapPicker("pickup_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          🗺️
                        </button>
                      </div>
                      {errors.pickup_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.pickup_address}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Alamat Antar
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={form.drop_address}
                          onChange={(e) => handleChange("drop_address", e.target.value)}
                          placeholder="Alamat lengkap antar"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", flex: 1 }}
                        />

                        <button
                          type="button"
                          onClick={() => getCurrentLocation("drop_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          📍
                        </button>

                        <button
                          type="button"
                          onClick={() => openMapPicker("drop_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          🗺️
                        </button>
                      </div>
                      {errors.drop_address && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.drop_address}</span>}
                    </label>

                    <label style={{ display: "grid", gap: 6, color: "#334155" }}>
                      Titik Tambahan (Opsional)
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {extraStops.map((stop, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                              const toIndex = index;
                              const newStops = [...extraStops];
                              const [moved] = newStops.splice(fromIndex, 1);
                              newStops.splice(toIndex, 0, moved);
                              setExtraStops(newStops);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 16px",
                              border: "1px solid #d1d5db",
                              borderRadius: 16,
                              background: "#fff",
                              cursor: "grab"
                            }}
                          >
                            <span style={{ fontSize: 18, color: "#6b7280" }}>⋮⋮</span>
                            <input
                              type="text"
                              value={stop}
                              onChange={(e) => {
                                const newStops = [...extraStops];
                                newStops[index] = e.target.value;
                                setExtraStops(newStops);
                              }}
                              placeholder="Alamat titik tambahan"
                              style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                background: "transparent"
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => getCurrentLocationForExtraStop(index)}
                              style={{
                                borderRadius: 14,
                                border: "none",
                                padding: "0 8px",
                                background: "#111827",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14
                              }}
                            >
                              📍
                            </button>
                            <button
                              type="button"
                              onClick={() => openMapPickerForExtraStop(index)}
                              style={{
                                borderRadius: 14,
                                border: "none",
                                padding: "0 8px",
                                background: "#10b981",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14
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
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: 18
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setExtraStops([...extraStops, ""])}
                          style={{
                            border: "1px dashed #d1d5db",
                            borderRadius: 16,
                            padding: "12px 16px",
                            background: "transparent",
                            color: "#6b7280",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8
                          }}
                        >
                          <span style={{ fontSize: 18 }}>➕</span>
                          Tambah Titik
                        </button>
                      </div>
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={form.customer_address}
                          onChange={(e) => handleChange("customer_address", e.target.value)}
                          placeholder="Alamat lengkap pengirim"
                          style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", flex: 1 }}
                        />

                        <button
                          type="button"
                          onClick={() => getCurrentLocation("customer_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          📍
                        </button>

                        <button
                          type="button"
                          onClick={() => openMapPicker("customer_address")}
                          style={{
                            borderRadius: 14,
                            border: "none",
                            padding: "0 14px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: "pointer"
                          }}
                        >
                          🗺️
                        </button>
                      </div>
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
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            value={form.recipient_address}
                            onChange={(e) => handleChange("recipient_address", e.target.value)}
                            placeholder="Alamat lengkap penerima"
                            style={{ borderRadius: 16, border: "1px solid #d1d5db", padding: "14px 16px", flex: 1 }}
                          />

                          <button
                            type="button"
                            onClick={() => getCurrentLocation("recipient_address")}
                            style={{
                              borderRadius: 14,
                              border: "none",
                              padding: "0 14px",
                              background: "#111827",
                              color: "#fff",
                              cursor: "pointer"
                            }}
                          >
                            📍
                          </button>

                          <button
                            type="button"
                            onClick={() => openMapPicker("recipient_address")}
                            style={{
                              borderRadius: 14,
                              border: "none",
                              padding: "0 14px",
                              background: "#10b981",
                              color: "#fff",
                              cursor: "pointer"
                            }}
                          >
                            🗺️
                          </button>
                        </div>
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
                    <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📍 Preview Estimasi</div>
                    
                    {form.service_type === "ojek" && (
                      <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                        <div>Dari: {form.pickup_address}</div>
                        <div>Ke: {form.drop_address}</div>
                      </div>
                    )}
                    {(form.service_type === "delivery" || form.service_type === "belanja") && (
                      <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                        <div>Dari: {form.purchase_address}</div>
                        <div>Ke: {form.customer_address}</div>
                      </div>
                    )}
                    {form.service_type === "kurir" && (
                      <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                        <div>Dari: {form.customer_address}</div>
                        <div>Ke: {form.recipient_address}</div>
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid #d1d5db", paddingTop: 8, marginTop: 8, display: "grid", gap: 6, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>📏 Jarak:</span>
                        <strong>{preview?.distance ? `${preview.distance.toFixed(2)} km` : "-"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>💰 Tarif Jarak:</span>
                        <strong>{preview?.tarif ? formatRupiah(preview.tarif) : "-"}</strong>
                      </div>
                      {preview?.service_fee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>📦 Service Fee ({preview?.stops} titik):</span>
                          <strong>{formatRupiah(preview.service_fee)}</strong>
                        </div>
                      )}
                    </div>

                    {preview.service_fee_breakdown && preview.service_fee_breakdown.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db", fontSize: 12, color: "#64748b" }}>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>Breakdown titik:</div>
                        {preview.service_fee_breakdown.map((item, index) => (
                          <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Titik {item.titik}:</span>
                            <span>Rp{new Intl.NumberFormat("id-ID").format(item.fee)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid #334155", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                      <span>Total:</span>
                      <span>{(preview?.price || preview?.total_price) ? formatRupiah(preview.price || preview.total_price) : "-"}</span>
                    </div>
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
        favoriteLocations={favoriteLocations}
        onSaveFavorite={saveFavoriteLocation}
      />
    </div>
  );
}
