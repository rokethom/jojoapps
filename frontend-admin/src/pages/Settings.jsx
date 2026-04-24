import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  FiUser, FiPhone, FiMapPin, FiSave,
  FiShield, FiGitBranch, FiMail, FiLock, FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  /* Editable fields */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  /* Password change */
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("auth/me/");
        setProfile(res.data);
        setName(res.data.name || "");
        setPhone(res.data.phone || "");
        setAddress(res.data.address || "");
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("auth/me/", { name, phone, address });
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPass.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("auth/change-password/", {
        old_password: oldPass,
        new_password: newPass,
      });
      showToast("Password changed successfully!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={loadingBox}>
        <div style={spinnerStyle}></div>
        <style>{`@keyframes settingsSpin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "var(--text-muted)" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={pageWrap}>
      {/* TOAST */}
      {toast && (
        <div style={{
          ...toastStyle,
          background: toast.type === "error" ? "var(--badge-cancelled-bg)" : "var(--badge-delivery-bg)",
          color: toast.type === "error" ? "var(--badge-cancelled-color)" : "var(--badge-delivery-color)",
          borderColor: toast.type === "error" ? "var(--badge-cancelled-color)" : "var(--badge-delivery-color)",
        }}>
          {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={headerSection}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-heading)", letterSpacing: "-0.02em" }}>Settings</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 15 }}>
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div style={gridLayout}>
        {/* LEFT: PROFILE CARD */}
        <div style={profileCard}>
          <div style={profileHeader}>
            <div style={avatarLarge}>
              <FiUser size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#fff" }}>{profile?.name || "Admin"}</h3>
              <span style={roleBadge}>
                <FiShield size={11} /> {profile?.role?.toUpperCase() || "ADMIN"}
              </span>
            </div>
          </div>

          <div style={profileInfoList}>
            <ProfileInfo icon={<FiMail />} label="Email" value={profile?.email || "—"} />
            <ProfileInfo icon={<FiPhone />} label="Phone" value={profile?.phone || "—"} />
            <ProfileInfo icon={<FiGitBranch />} label="Branch" value={profile?.branch?.name || "—"} />
            <ProfileInfo icon={<FiMapPin />} label="Area" value={profile?.branch?.area || "—"} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={rightCol}>
          {/* EDIT PROFILE SECTION */}
          <div style={settingsCard} className="animate-fade-in-up delay-1">
            <h4 style={sectionTitle}>
              <FiUser /> Edit Profile
            </h4>

            <div style={formGrid}>
              <div style={fieldGroup}>
                <label style={label}>Full Name</label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div style={fieldGroup}>
                <label style={label}>Phone Number</label>
                <input
                  style={inputStyle}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Address</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
              />
            </div>

            <button
              style={saveBtn}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* CHANGE PASSWORD SECTION */}
          <div style={settingsCard} className="animate-fade-in-up delay-2">
            <h4 style={sectionTitle}>
              <FiLock /> Change Password
            </h4>

            <div style={fieldGroup}>
              <label style={label}>Current Password</label>
              <input
                style={inputStyle}
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div style={formGrid}>
              <div style={fieldGroup}>
                <label style={label}>New Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div style={fieldGroup}>
                <label style={label}>Confirm New Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              style={saveBtn}
              onClick={handleChangePassword}
              disabled={saving}
            >
              <FiLock /> {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function ProfileInfo({ icon, label, value }) {
  return (
    <div style={profileInfoItem}>
      <span style={profileInfoIcon}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

/* ================= STYLES — fully themed ================= */

const pageWrap = { padding: 10, position: "relative" };

const headerSection = { marginBottom: 28 };

const toastStyle = {
  position: "fixed", top: 24, right: 24, zIndex: 999,
  display: "flex", alignItems: "center", gap: 8,
  padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
  border: "1px solid", boxShadow: "var(--shadow-lg)",
  animation: "fadeIn 0.3s ease",
};

const gridLayout = {
  display: "grid", gridTemplateColumns: "340px 1fr", gap: 24,
};

/* Profile Card — keeps dark gradient which works in both themes */
const profileCard = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  borderRadius: 20, padding: 28, color: "#fff",
  alignSelf: "start",
  boxShadow: "var(--shadow-md)",
};

const profileHeader = {
  display: "flex", alignItems: "center", gap: 16, marginBottom: 28,
  paddingBottom: 20, borderBottom: "1px solid #334155",
};

const avatarLarge = {
  width: 60, height: 60, borderRadius: "50%",
  background: "rgba(99,102,241,0.25)", color: "var(--accent-light)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const roleBadge = {
  display: "inline-flex", alignItems: "center", gap: 4,
  marginTop: 6, fontSize: 11, fontWeight: 600,
  padding: "3px 10px", borderRadius: 20,
  background: "rgba(99,102,241,0.25)", color: "var(--accent-light)",
};

const profileInfoList = {
  display: "flex", flexDirection: "column", gap: 16,
};

const profileInfoItem = {
  display: "flex", alignItems: "center", gap: 12,
};

const profileInfoIcon = {
  width: 32, height: 32, borderRadius: 8,
  background: "rgba(255,255,255,0.08)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#94a3b8", fontSize: 14,
};

/* Settings Cards */
const rightCol = {
  display: "flex", flexDirection: "column", gap: 20,
};

const settingsCard = {
  background: "var(--bg-card)", borderRadius: 20, padding: 28,
  border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-sm)",
  transition: "all 0.3s ease",
};

const sectionTitle = {
  margin: "0 0 24px", fontSize: 16, fontWeight: 600, color: "var(--text-heading)",
  display: "flex", alignItems: "center", gap: 8,
};

const formGrid = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
};

const fieldGroup = {
  marginBottom: 16,
};

const label = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "var(--text-secondary)", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1px solid var(--border)", fontSize: 14, color: "var(--text-primary)",
  outline: "none", background: "var(--bg-input)",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const saveBtn = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 24px", borderRadius: 12, border: "none",
  background: "var(--accent)", color: "#fff",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
  marginTop: 4, transition: "opacity 0.15s ease",
};

const spinnerStyle = {
  width: 36, height: 36, border: "4px solid var(--border)",
  borderTopColor: "var(--accent)", borderRadius: "50%",
  animation: "settingsSpin 0.8s linear infinite", marginBottom: 14,
};

const loadingBox = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", height: "60vh", color: "var(--text-muted)",
};
