import { useState } from "react";
import api from "../api/axios";
import { FiUser, FiPhone, FiSave } from "react-icons/fi";

export default function Profile() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/users/profile/", { name, phone });
      alert("Saved!");
    } catch {
      alert("Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in" style={box}>
      <h2 style={{ margin: "0 0 20px", color: "var(--text-heading)", fontSize: 22, fontWeight: 700 }}>Edit Profile</h2>

      <div style={fieldGroup}>
        <label style={label}><FiUser size={13} /> Name</label>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />
      </div>

      <div style={fieldGroup}>
        <label style={label}><FiPhone size={13} /> Phone</label>
        <input
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={input}
        />
      </div>

      <button onClick={save} style={btn} disabled={saving}>
        <FiSave /> {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

const box = {
  background: "var(--bg-card)",
  padding: 28,
  borderRadius: 20,
  border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-sm)",
  maxWidth: 480,
  transition: "all 0.3s ease",
};

const fieldGroup = {
  marginBottom: 16,
};

const label = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 13, fontWeight: 500, color: "var(--text-secondary)",
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const btn = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  transition: "opacity 0.15s ease",
  marginTop: 4,
};