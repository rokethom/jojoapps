import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { gapi } from "gapi-script";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [focused, setFocused] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuth, setGoogleAuth] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(form.username, form.password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("❌ Login error:", error);
      console.error("   Response:", error.response?.data);
      console.error("   Status:", error.response?.status);
      const errorMsg = error.response?.data?.detail || error.message || "Login gagal 😢";
      alert(errorMsg);
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
        console.log("✅ Google Auth initialized for Login");
      });
    };

    gapi.load('client:auth2', initGoogleAuth);
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    if (!googleAuth) {
      alert("Google auth belum siap, silakan tunggu sebentar dan coba lagi.");
      setGoogleLoading(false);
      return;
    }

    try {
      const googleUser = await googleAuth.signIn();
      const accessToken = googleUser.getAuthResponse().access_token;

      await googleLogin(accessToken);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = "Google login gagal 😢";
      
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
        0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.4); }
        50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.6); }
      }

      @keyframes waveMotion {
        0% { transform: translateX(0) translateY(0); }
        100% { transform: translateX(100%) translateY(0); }
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
        border: 1px solid rgba(0, 217, 255, 0.3) !important;
        animation: portalExpand 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5) !important;
      }

      .login-button {
        background: linear-gradient(135deg, #7c3aed, #38bdf8) !important;
        animation: neonPulse 3s infinite !important;
      }

      .login-button:hover {
        transform: translateY(-2px);
        filter: brightness(1.2);
      }

      input {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #f8fafc !important;
      }

      input:focus {
        border-color: #00d9ff !important;
        background: rgba(255, 255, 255, 0.08) !important;
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
            background: i % 2 === 0 ? "#00d9ff" : "#ff006e",
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
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img
            src={process.env.PUBLIC_URL + "/logo.png"}
            alt="logo"
            style={{
              width: 96,
              height: 96,
              marginBottom: 20,
              borderRadius: 18,
              objectFit: "cover",
              display: "inline-block",
            }}
          />
          <h2 style={{ 
            margin: 0, 
            fontSize: "2rem", 
            background: "linear-gradient(135deg, #00d9ff, #ff006e)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            fontWeight: 800
          }}>
            Selamat Datang
          </h2>
          <p style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 14, marginTop: 10 }}>
            Masuk ke nexus Anda untuk melanjutkan
          </p>
        </div>

        {/* INPUT USERNAME */}
        <div style={{ position: "relative", marginBottom: 25 }}>
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
        <div style={{ position: "relative", marginBottom: 15 }}>
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

        {/* FORGOT */}
        <div style={{
          textAlign: "right",
          marginBottom: 30,
          fontSize: 12,
          color: "#00d9ff",
          cursor: "pointer",
          opacity: 0.8
        }}>
          Lupa password?
        </div>

        {/* BUTTON LOGIN */}
        <button
          onClick={handleLogin}
          disabled={loading || success}
          className="login-button"
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
          {loading ? "Menghubungkan..." : success ? "Berhasil!" : "MASUK"}
        </button>

        {/* DIVIDER */}
        <div style={{
          margin: "20px 0",
          textAlign: "center",
          position: "relative"
        }}>
          <div style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.2)",
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

        {/* GOOGLE LOGIN BUTTON */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || success}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.05)",
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
          {googleLoading ? "Menghubungkan..." : "Masuk dengan Google"}
        </button>

        {/* REGISTER */}
        <div style={{
          textAlign: "center",
          marginTop: 25,
          fontSize: 13,
          color: "rgba(248, 250, 252, 0.5)"
        }}>
          Belum punya akun?{" "}
          <span 
            onClick={() => navigate("/register")}
            style={{
            color: "#ff006e",
            cursor: "pointer",
            fontWeight: "bold"
          }}>
            Daftar
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
                background: i % 2 === 0 ? "#00d9ff" : "#ff006e",
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