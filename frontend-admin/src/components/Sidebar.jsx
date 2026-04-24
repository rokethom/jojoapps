import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome, FiBox, FiUsers, FiSettings, FiGitBranch, FiLogOut, FiDollarSign, FiClipboard, FiMessageSquare,
} from "react-icons/fi";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const location = useLocation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    window.location.href = "/";
  };

  return (
    <aside style={{ ...sidebar, width: collapsed ? 72 : 250 }}>
      {/* LOGO */}
      <div style={logoWrap}>
        <div style={logoIcon}>J</div>
        {!collapsed && <span style={logoText}>Jojango</span>}
      </div>

      {/* NAV */}
      <nav style={navSection}>
        <NavItem icon={<FiHome size={18} />} label="Dashboard" path="/admin"
          active={location.pathname === "/admin"} onClick={() => nav("/admin")} collapsed={collapsed} />
        <NavItem icon={<FiBox size={18} />} label="Orders" path="/admin/orders"
          active={location.pathname.includes("orders")} onClick={() => nav("/admin/orders")} collapsed={collapsed} />
        <NavItem icon={<FiUsers size={18} />} label="Users" path="/admin/users"
          active={location.pathname.includes("users")} onClick={() => nav("/admin/users")} collapsed={collapsed} />
        <NavItem icon={<FiGitBranch size={18} />} label="Branch" path="/admin/branch"
          active={location.pathname.includes("branch")} onClick={() => nav("/admin/branch")} collapsed={collapsed} />
        <NavItem icon={<FiDollarSign size={18} />} label="Settlement" path="/admin/rekap"
          active={location.pathname.includes("Setoran")} onClick={() => nav("/admin/rekap")} collapsed={collapsed} />
        <NavItem icon={<FiClipboard size={18} />} label="Driver Requests" path="/admin/driver-requests"
          active={location.pathname.includes("driver-requests")} onClick={() => nav("/admin/driver-requests")} collapsed={collapsed} />
        <NavItem icon={<FiMessageSquare size={18} />} label="Chat" path="/admin/chat"
          active={location.pathname.includes("chat")} onClick={() => nav("/admin/chat")} collapsed={collapsed} />
        <NavItem icon={<FiSettings size={18} />} label="Settings" path="/admin/settings"
          active={location.pathname.includes("settings")} onClick={() => nav("/admin/settings")} collapsed={collapsed} />
      </nav>

      {/* BOTTOM LOGOUT */}
      <div style={bottomSection}>
        <div style={divider}></div>
        <div style={logoutBtn} onClick={handleLogout}>
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...navItem,
        background: active
          ? "rgba(99,102,241,0.12)"
          : hovered
          ? "rgba(255,255,255,0.04)"
          : "transparent",
        color: active ? "#818cf8" : "#94a3b8",
        fontWeight: active ? 600 : 400,
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : ""}
    >
      <div style={{
        ...navIconBox,
        background: active ? "rgba(99,102,241,0.18)" : "transparent",
        color: active ? "#818cf8" : "#94a3b8",
      }}>
        {icon}
      </div>
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && <div style={activeIndicator}></div>}
    </div>
  );
}

/* ================= STYLES ================= */

const sidebar = {
  background: "#0c111d",
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  position: "sticky",
  top: 0,
  transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
  overflow: "hidden",
  zIndex: 50,
};

const logoWrap = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "24px 20px 32px",
};

const logoIcon = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "linear-gradient(135deg, #6366f1, #818cf8)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 16,
  flexShrink: 0,
};

const logoText = {
  fontSize: 20,
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
};

const navSection = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "0 12px",
};

const navItem = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 14,
  position: "relative",
  whiteSpace: "nowrap",
  transition: "all 0.15s ease",
};

const navIconBox = {
  width: 34,
  height: 34,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "all 0.15s ease",
};

const activeIndicator = {
  position: "absolute",
  right: 12,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#818cf8",
};

const bottomSection = {
  padding: "0 12px 20px",
};

const divider = {
  height: 1,
  background: "rgba(255,255,255,0.06)",
  margin: "8px 8px 12px",
};

const logoutBtn = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 14,
  color: "#ef4444",
  transition: "all 0.15s ease",
};