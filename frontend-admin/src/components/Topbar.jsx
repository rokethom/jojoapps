import { useState, useEffect, useRef } from "react";
import { FiBell, FiSearch, FiX, FiChevronDown, FiUser, FiSettings, FiLogOut, FiSun, FiMoon } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import NotificationCenter from "./NotificationCenter";
import notificationService from "../services/notificationService";

export default function Topbar() {
  const nav = useNavigate();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    api.get("auth/me/").then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // Initialize notification service and get unread count
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();

    // Listen for notification events
    const handleUnreadCountChanged = (count) => {
      setUnreadCount(count);
    };

    notificationService.on('unreadCountChanged', handleUnreadCountChanged);

    return () => {
      notificationService.off('unreadCountChanged', handleUnreadCountChanged);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    window.location.href = "/";
  };

  const displayName = profile?.name || "Admin";
  const displayRole = profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || "Admin";

  return (
    <header style={{ ...topbar, background: "var(--bg-topbar)", borderColor: "var(--topbar-border)" }}>
      {/* SEARCH */}
      <div style={{ ...searchWrap, background: "var(--bg-input)" }}>
        <FiSearch size={16} style={{ color: "var(--text-muted)" }} />
        <input
          placeholder="Search anything…"
          style={{ ...searchInput, color: "var(--text-primary)" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <FiX size={14} style={{ color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setQuery("")} />
        )}
      </div>

      {/* RIGHT */}
      <div style={rightSection}>
        {/* THEME TOGGLE */}
        <button className="theme-toggle" onClick={toggle} title={dark ? "Switch to Light" : "Switch to Dark"}>
          <div className="theme-toggle-knob">
            {dark ? <FiMoon size={12} color="#818cf8" /> : <FiSun size={12} color="#f59e0b" />}
          </div>
        </button>

        {/* NOTIFICATIONS */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            style={{ ...iconButton, background: "var(--bg-input)", color: "var(--text-secondary)" }}
            title="Notifications"
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: 'var(--error)',
                color: 'white',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-topbar)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* PROFILE */}
        <div ref={dropdownRef} style={profileWrap}>
          <button style={{ ...profileBtn, borderColor: "var(--border)", background: "var(--bg-card)" }} onClick={() => setOpen(!open)}>
            <div style={avatarBox}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={profileInfo}>
              <span style={{ ...profileName, color: "var(--text-primary)" }}>{displayName}</span>
              <span style={{ ...profileRole, color: "var(--text-muted)" }}>{displayRole}</span>
            </div>
            <FiChevronDown size={14} style={{
              color: "var(--text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s ease",
            }} />
          </button>

          {open && (
            <div style={{ ...dropdown, background: "var(--bg-card)", borderColor: "var(--border)" }} className="animate-fade-in">
              <div style={dropdownHeader}>
                <div style={avatarBoxLg}>{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{displayRole}</div>
                </div>
              </div>
              <div style={{ ...dropdownDivider, background: "var(--border-light)" }}></div>
              <div style={{ ...dropdownItem, color: "var(--text-secondary)" }} onClick={() => { setOpen(false); nav("/admin/settings"); }}>
                <FiUser size={15} /> Profile
              </div>
              <div style={{ ...dropdownItem, color: "var(--text-secondary)" }} onClick={() => { setOpen(false); nav("/admin/settings"); }}>
                <FiSettings size={15} /> Settings
              </div>
              <div style={{ ...dropdownDivider, background: "var(--border-light)" }}></div>
              <div style={{ ...dropdownItem, color: "var(--danger)" }} onClick={handleLogout}>
                <FiLogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </header>
  );
}

/* ================= STYLES ================= */

const topbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 28px",
  borderBottom: "1px solid",
  position: "sticky",
  top: 0,
  zIndex: 40,
  transition: "background 0.3s ease, border-color 0.3s ease",
};

const searchWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 10,
  padding: "9px 14px",
  width: 340,
  maxWidth: "40vw",
  transition: "background 0.3s ease",
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  flex: 1,
  fontSize: 14,
};

const rightSection = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const iconButton = {
  position: "relative",
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 18,
  transition: "background 0.3s ease",
};

const profileWrap = { position: "relative" };

const profileBtn = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 12px 6px 6px",
  borderRadius: 12,
  border: "1px solid",
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const avatarBox = {
  width: 34, height: 34, borderRadius: 9,
  background: "linear-gradient(135deg, #6366f1, #818cf8)",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700, fontSize: 14,
};

const avatarBoxLg = {
  width: 40, height: 40, borderRadius: 10,
  background: "linear-gradient(135deg, #6366f1, #818cf8)",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 700, fontSize: 16, flexShrink: 0,
};

const profileInfo = { display: "flex", flexDirection: "column", alignItems: "flex-start" };
const profileName = { fontSize: 13, fontWeight: 600, lineHeight: 1.2 };
const profileRole = { fontSize: 11 };

const dropdown = {
  position: "absolute", right: 0, top: "calc(100% + 8px)",
  width: 220, borderRadius: 14, border: "1px solid",
  boxShadow: "var(--shadow-lg)", padding: 8, zIndex: 100,
  transition: "background 0.3s ease",
};

const dropdownHeader = { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" };
const dropdownDivider = { height: 1, margin: "4px 0" };
const dropdownItem = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14,
};