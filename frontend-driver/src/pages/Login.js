import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login/", {
        username,
        password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      window.dispatchEvent(new Event("auth-login"));
      nav("/");
    } catch (err) {
      setError("Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 20,
        padding: 30,
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={process.env.PUBLIC_URL + "/logo.png"}
            alt="logo"
            style={{
              width: 88,
              height: 88,
              marginBottom: 16,
              borderRadius: 18,
              objectFit: "cover",
            }}
          />
        </div>
        <h2 style={{ textAlign: "center", margin: 0, marginBottom: 10 }}>
          Driver Login
        </h2>

        <p style={{ textAlign: "center", color: "#666", marginBottom: 20 }}>
          Masuk untuk menerima order
        </p>

        {error && (
          <div style={{
            background: "#fee",
            color: "#c33",
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 8,
            border: "none",
            background: loading ? "#999" : "linear-gradient(135deg, #667eea, #764ba2)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
}
