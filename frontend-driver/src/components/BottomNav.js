import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav({ notificationCount = 0, onClearOrderNotifications = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const navItems = [
    { path: "/", icon: "🏠", label: "Home", color: "#667eea" },
    { path: "/order", icon: "📦", label: "Order", color: "#764ba2" },
    { path: "/driver", icon: "🚗", label: "Driver", color: "#f093fb" },
    { path: "/chat", icon: "💬", label: "Chat", color: "#4facfe" },
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (location.pathname === "/order") {
      onClearOrderNotifications();
    }
  }, [location.pathname, onClearOrderNotifications]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      {navItems.map((item) => (
        <div
          key={item.path}
          onClick={() => navigate(item.path)}
          onMouseEnter={() => setHovered(item.path)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 8,
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform:
              isActive(item.path) || hovered === item.path
                ? "scale(1.1) translateY(-4px)"
                : "scale(1)",
            position: "relative",
          }}
        >
          {/* BACKGROUND BUBBLE */}
          <div
            style={{
              position: "absolute",
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: isActive(item.path)
                ? item.color
                : hovered === item.path
                ? `${item.color}20`
                : "transparent",
              transition: "all 0.3s ease",
              zIndex: -1,
            }}
          />

          {/* ICON */}
          <div
            style={{
              fontSize: 24,
              transition: "all 0.3s ease",
              color: isActive(item.path) ? item.color : "#666",
              position: "relative",
            }}
          >
            {item.icon}
            {item.path === "/order" && notificationCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  right: -14,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </div>
            )}
          </div>

          {/* LABEL */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              marginTop: 4,
              color: isActive(item.path) ? item.color : "#666",
              transition: "all 0.3s ease",
              maxWidth: 40,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.label}
          </div>

          {/* ACTIVE INDICATOR */}
          {isActive(item.path) && (
            <div
              style={{
                position: "absolute",
                bottom: 2,
                width: 6,
                height: 3,
                borderRadius: "2px 2px 0 0",
                background: item.color,
                animation: "slideUp 0.4s ease",
              }}
            />
          )}
        </div>
      ))}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
