import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) nav("/admin");
  }, [nav]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("auth/login/", {
        username,
        password,
      });

      localStorage.setItem("access", res.data.access);

      const user = jwtDecode(res.data.access);

      if (user.role === "admin") {
        nav("/admin");
      } else {
        nav("/admin/orders");
      }

    } catch {
      setError("Username atau password salah");
    }

    setLoading(false);
  };

  return (
    <div style={container}>

      <div style={card}>

        {/* LOGO */}
        <img
          src={process.env.PUBLIC_URL + "/logo.png"}
          alt="logo"
          style={logo}
        />

        <h2 style={{ marginBottom: 5 }}>Siap ON!!</h2>
        <p style={subtitle}>
          Masuk ke dashboard Jojo System
        </p>

        {error && <div style={errorBox}>{error}</div>}

        {/* USERNAME */}
        <input
          style={input}
          placeholder="Email / Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* PASSWORD */}
        <div style={{ position: "relative" }}>
          <input
            style={input}
            type={show ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <span style={eye} onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁"}
          </span>
        </div>

        <div style={forgot}>Forgot password?</div>

        {/* BUTTON */}
        <button
          style={{
            ...button,
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleLogin}
        >
          {loading ? "Loading..." : "Get Started"}
        </button>

      </div>

    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background:
    "linear-gradient(to bottom, #dbeafe, #f0f9ff)",
};

/* CARD */
const card = {
  width: "90%",
  maxWidth: 380,
  padding: 30,
  borderRadius: 20,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
  textAlign: "center",
};

/* LOGO */
const logo = {
  width: 60,
  height: 60,
  borderRadius: 12,
  marginBottom: 15,
};

/* TEXT */
const subtitle = {
  color: "#666",
  marginBottom: 20,
  fontSize: 14,
};

/* INPUT */
const input = {
  width: "100%",
  padding: 14,
  marginBottom: 15,
  borderRadius: 12,
  border: "1px solid #ddd",
  outline: "none",
};

/* BUTTON */
const button = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(90deg, #111, #333)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "0.3s",
};

/* ERROR */
const errorBox = {
  background: "#ef4444",
  color: "#fff",
  padding: 10,
  borderRadius: 8,
  marginBottom: 15,
};

/* EYE */
const eye = {
  position: "absolute",
  right: 15,
  top: 15,
  cursor: "pointer",
};

/* FORGOT */
const forgot = {
  fontSize: 12,
  color: "#888",
  textAlign: "right",
  marginBottom: 10,
};