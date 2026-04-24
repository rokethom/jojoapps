import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import axios from "../api/axios";
import { gapi } from "gapi-script";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export default function Register() {
  const { register, googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    name: "",
    phone: "",
    password: "",
  });

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuth, setGoogleAuth] = useState(null);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get("/branch/list/");
        setBranches(res.data.branches || []);
        console.log("✅ Branches loaded:", res.data.branches);
      } catch (err) {
        console.warn("⚠️ Failed to fetch branches:", err);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Request user's location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setLocationLoading(false);
          console.log(`📍 Location detected: (${latitude}, ${longitude})`);
        },
        (error) => {
          setLocationError(error.message);
          setLocationLoading(false);
          console.warn(`⚠️ Geolocation error: ${error.message}`);
        }
      );
    } else {
      setLocationError("Geolocation not supported");
      setLocationLoading(false);
    }
  }, []);

  const handleRegister = async () => {
    if (!form.username || !form.name || !form.phone || !form.password) {
      alert("Semua field harus diisi! ✋");
      return;
    }

    // Validate branch selection if geolocation failed
    if (!location && !selectedBranch) {
      alert("Silakan pilih area/cabang! 📍");
      return;
    }

    setLoading(true);
    try {
      console.log("🔵 Starting registration...");
      await register(
        form.username,
        form.password,
        form.name,
        form.phone,
        location?.latitude,
        location?.longitude,
        selectedBranch
      );
      console.log("✅ Registration successful!");
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("❌ Registration error:", err);
      
      let errorMessage = "Terjadi kesalahan";
      
      // Extract specific error messages from backend response
      if (err.response?.data) {
        const data = err.response.data;
        if (data.username) errorMessage = data.username[0] || "Username sudah digunakan";
        else if (data.password) errorMessage = data.password[0] || "Password tidak valid";
        else if (data.name) errorMessage = data.name[0] || "Nama tidak valid";
        else if (data.phone) errorMessage = data.phone[0] || "Nomor HP tidak valid";
        else if (data.branch_id) errorMessage = data.branch_id[0] || "Cabang tidak valid";
        else if (typeof data === 'string') errorMessage = data;
        else if (data.detail) errorMessage = data.detail;
        else errorMessage = JSON.stringify(data);
      }
      
      alert("❌ Pendaftaran gagal: " + errorMessage);
      setLoading(false);
    }
  };

  // Google OAuth2 initialization
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("Missing REACT_APP_GOOGLE_CLIENT_ID for Google OAuth.");
      return;
    }

    const initGoogleAuth = () => {
      gapi.load('auth2', () => {
        const auth2 = gapi.auth2.init({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'profile email',
        });
        setGoogleAuth(auth2);
        console.log("✅ Google Auth initialized for Register");
      });
    };

    gapi.load('client:auth2', initGoogleAuth);
  }, []);

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    if (!googleAuth) {
      alert("Google auth belum siap, silakan tunggu sebentar dan coba lagi.");
      setGoogleLoading(false);
      return;
    }

    try {
      console.log("🔵 Starting Google sign in...");
      console.log("📋 Client ID:", GOOGLE_CLIENT_ID);
      console.log("📍 Current origin:", window.location.origin);
      
      const googleUser = await googleAuth.signIn();
      const accessToken = googleUser.getAuthResponse().access_token;
      console.log("✅ Google sign in successful, token received");

      await googleLogin(accessToken);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error('Google register error:', error);
      
      let errorMessage = "Google register gagal 😢";
      
      // Extract specific error messages
      if (error.error === 'popup_closed_by_user') {
        errorMessage = "Popup Google ditutup. Silakan coba lagi.";
      } else if (error.error === 'access_denied') {
        errorMessage = "Akses Google ditolak. Pastikan Anda mengizinkan akses.";
      } else if (error.error === 'popup_blocked_by_browser') {
        errorMessage = "Popup diblokir browser. Izinkan popup untuk domain ini.";
      } else if (error.details) {
        errorMessage = `Error: ${error.details}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      } else if (error.code) {
        errorMessage = `Error code: ${error.code}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // Show the full error object for debugging
        errorMessage = `Error: ${JSON.stringify(error)}`;
      }
      
      alert(errorMessage);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes neonPulse {
        0%, 100% { box-shadow: 0 0 15px rgba(255, 0, 110, 0.4); }
        50% { box-shadow: 0 0 30px rgba(0, 217, 255, 0.6); }
      }

      @keyframes portalExpand {
        0% { 
          opacity: 0;
          transform: scale(0.9) translateY(30px);
          filter: blur(10px);
        }
        100% { 
          opacity: 1;
          transform: scale(1) translateY(0);
          filter: blur(0);
        }
      }

      .portal-form {
        background: rgba(15, 15, 30, 0.85) !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 0, 110, 0.3) !important;
        animation: portalExpand 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5) !important;
      }

      .register-button {
        background: linear-gradient(135deg, #ff006e, #00d9ff) !important;
        animation: neonPulse 3s infinite !important;
      }

      .register-button:hover {
        transform: translateY(-2px);
        filter: brightness(1.2);
      }

      input, select {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #f8fafc !important;
        font-size: 14px;
      }

      input:focus, select:focus {
        border-color: #ff006e !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }

      select option {
        background: #0a0a1e;
        color: #f8fafc;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{
      position: "relative",
      minHeight: "100dvh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px 16px",
      background: "linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #2d004d 100%)",
      color: "#f8fafc",
      overflow: "hidden"
    }}>

      {/* Decorative Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: Math.random() * 4,
            height: Math.random() * 4,
            background: i % 2 === 0 ? "#ff006e" : "#00d9ff",
            borderRadius: "50%",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
            animation: `neonPulse ${Math.random() * 3 + 2}s infinite`
          }}
        />
      ))}

      {/* Portal Form */}
      <div className="portal-form" style={{
        position: "relative",
        zIndex: 2,
        width: "clamp(320px, 90%, 420px)",
        maxWidth: 420,
        borderRadius: 30,
        padding: 40,
      }}>

        {/* LOGO / TITLE */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            fontSize: 60,
            marginBottom: 20,
            filter: "drop-shadow(0 0 15px rgba(255, 0, 110, 0.5))"
          }}>
            ✨
          </div>
          <h2 style={{ 
            margin: 0, 
            fontSize: "2rem", 
            background: "linear-gradient(135deg, #ff006e, #00d9ff)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            fontWeight: 800
          }}>
            Daftar Akun
          </h2>
          <p style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 14, marginTop: 10 }}>
            Bergabunglah dengan nexus kami hari ini
          </p>
        </div>

        {/* LOCATION STATUS */}
        <div style={{
          marginBottom: 25,
          padding: 15,
          borderRadius: 12,
          background: "rgba(0, 217, 255, 0.1)",
          border: "1px solid rgba(0, 217, 255, 0.3)",
          fontSize: 12
        }}>
          {locationLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>🔄</span>
              <span>Mendeteksi lokasi Anda...</span>
            </div>
          ) : location ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span>✅ Lokasi Terdeteksi</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(248, 250, 252, 0.7)" }}>
                Koordinat: ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
              </div>
              <div style={{ fontSize: 11, color: "rgba(0, 217, 255, 0.8)", marginTop: 5 }}>
                📍 Sistem akan otomatis menentukan cabang terdekat
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>⚠️</span>
              <span>{locationError || "Geolocation tidak tersedia"}</span>
            </div>
          )}
        </div>

        {/* INPUT NAME */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            placeholder="Nama Lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 15,
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* INPUT PHONE */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            placeholder="Nomor HP"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 15,
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* INPUT USERNAME */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 15,
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* INPUT PASSWORD */}
        <div style={{ position: "relative", marginBottom: 30 }}>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 15,
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* BRANCH SELECTION (Fallback if no geolocation) */}
        {!location && branches.length > 0 && (
          <div style={{ position: "relative", marginBottom: 30 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
              color: "rgba(248, 250, 252, 0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              📍 Pilih Area/Cabang
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={branchesLoading}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 15,
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s ease",
                cursor: branchesLoading ? "not-allowed" : "pointer",
                opacity: branchesLoading ? 0.6 : 1
              }}
            >
              <option value="">
                {branchesLoading ? "Memuat cabang..." : "Pilih cabang Anda"}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.area}
                </option>
              ))}
            </select>
            {selectedBranch && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: "#00d9ff",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                ✅ Cabang dipilih: {branches.find(b => b.id === selectedBranch)?.name}
              </div>
            )}
          </div>
        )}

        {/* BUTTON REGISTER */}
        <button
          onClick={handleRegister}
          disabled={loading || success}
          className="register-button"
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            border: "none",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: loading || success ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "Memproses..." : success ? "Berhasil Didaftar!" : "DAFTAR SEKARANG"}
        </button>

        {/* DIVIDER */}
        <div style={{
          margin: "20px 0",
          textAlign: "center",
          position: "relative"
        }}>
          <div style={{
            height: 1,
            background: "rgba(255, 0, 110, 0.3)",
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0
          }} />
          <span style={{
            background: "rgba(15, 15, 30, 0.85)",
            padding: "0 16px",
            color: "rgba(248, 250, 252, 0.6)",
            fontSize: 12
          }}>
            ATAU
          </span>
        </div>

        {/* GOOGLE REGISTER BUTTON */}
        <button
          onClick={handleGoogleRegister}
          disabled={googleLoading || success}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255, 0, 110, 0.3)",
            background: "rgba(255, 0, 110, 0.05)",
            color: "#f8fafc",
            fontWeight: 600,
            fontSize: 14,
            cursor: googleLoading || success ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "Memproses..." : "Daftar dengan Google"}
        </button>

        {/* LOGIN LINK */}
        <div style={{
          textAlign: "center",
          marginTop: 25,
          fontSize: 13,
          color: "rgba(248, 250, 252, 0.5)"
        }}>
          Sudah punya akun?{" "}
          <span 
            onClick={() => navigate("/login")}
            style={{
              color: "#00d9ff",
              cursor: "pointer",
              fontWeight: "bold"
            }}>
            Masuk
          </span>
        </div>

      </div>

      {/* Confetti on success */}
      {success && (
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3
        }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                left: `${Math.random() * 100}%`,
                top: "100%",
                background: i % 2 === 0 ? "#ff006e" : "#00d9ff",
                borderRadius: "2px",
                animation: `confetti 2s ease-out forwards`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
          <style>{`
            @keyframes confetti {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}
