import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import ChatModal from "../components/ChatModal";

export default function Profile() {
  const { user, logout, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hologramScan {
        0%, 100% { transform: translateX(-100%); opacity: 0; }
        50% { transform: translateX(100%); opacity: 0.6; }
      }

      @keyframes dataFlow {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes identityPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(0,217,255,0.3); }
        50% { box-shadow: 0 0 40px rgba(0,217,255,0.8), 0 0 60px rgba(255,0,110,0.4); }
      }

      @keyframes nexusGlow {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }

      @keyframes particleOrbit {
        0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
      }

      .hologram-card {
        background: linear-gradient(135deg, rgba(15,15,30,0.9), rgba(26,0,51,0.9));
        backdrop-filter: blur(15px);
        border: 1px solid rgba(0,217,255,0.3);
        position: relative;
        overflow: hidden;
      }

      .hologram-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, transparent, rgba(0,217,255,0.1), transparent);
        animation: hologramScan 3s ease-in-out infinite;
      }

      .data-stream {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00d9ff, transparent);
        animation: dataFlow 2s linear infinite;
      }

      .identity-avatar {
        animation: identityPulse 3s ease-in-out infinite;
        position: relative;
      }

      .identity-avatar::after {
        content: '';
        position: absolute;
        inset: -10px;
        border: 2px solid transparent;
        border-radius: 50%;
        background: conic-gradient(from 0deg, #00d9ff, #ff006e, #00d9ff);
        animation: particleOrbit 4s linear infinite;
        z-index: -1;
      }

      .nexus-button {
        background: linear-gradient(135deg, #00d9ff, #ff006e);
        animation: nexusGlow 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .nexus-button::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: hologramScan 2s ease-in-out infinite;
      }

      .menu-item {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .menu-item:hover {
        transform: translateX(5px);
        box-shadow: 0 8px 25px rgba(0,217,255,0.2);
      }

      .menu-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0;
        background: linear-gradient(135deg, #00d9ff, #ff006e);
        transition: width 0.3s ease;
      }

      .menu-item:hover::before {
        width: 4px;
      }
    `;
    document.head.appendChild(style);

    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }

    return () => {
      document.head.removeChild(style);
    };
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFeedback("");

    try {
      await updateProfile(form);
      setFeedback("Identitas berhasil diperbarui.");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setFeedback("Gagal, silahkan coba lagi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuClick = (title) => {
    if (title === "Edit Profile") {
      setIsEditing(true);
      return;
    }
    if (title === "Bantuan") {
      // Open chat support as modal to avoid navigating away and prevent logout
      setIsChatOpen(true);
      return;
    }
  };

  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #2d004d 100%)",
      color: "#f8fafc",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* PARTICLE BACKGROUND */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none"
      }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 2,
              height: 2,
              background: "#00d9ff",
              borderRadius: "50%",
              animation: `particleOrbit 4s linear infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <div style={{
        padding: "30px 20px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 2
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 28,
          background: "linear-gradient(135deg, #00d9ff, #ff006e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: "0 0 30px rgba(0,217,255,0.5)",
          animation: "hologramScan 4s ease-in-out infinite"
        }}>
          🌀 Identity 
        </h1>
        <p style={{
          margin: "10px 0 0",
          fontSize: 14,
          color: "rgba(248,250,252,0.7)",
          fontStyle: "italic"
        }}>
          Jojo Aplikasi by Aplikasi Joker
        </p>
      </div>

      {/* CONTENT */}
      <div style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px 100px",
        position: "relative",
        zIndex: 2
      }}>

        {/* IDENTITY CARD */}
        <div className="hologram-card" style={{
          borderRadius: 25,
          padding: 30,
          marginBottom: 25,
          position: "relative"
        }}>
          <div className="data-stream" />

          {/* AVATAR */}
          <div style={{
            textAlign: "center",
            marginBottom: 20
          }}>
            <div className="identity-avatar" style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00d9ff, #ff006e)",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              color: "#fff",
              boxShadow: "0 0 30px rgba(0,217,255,0.5)"
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "👤"}
            </div>
          </div>

          {/* IDENTITY INFO */}
          <div style={{
            textAlign: "center",
            marginBottom: 25
          }}>
            <h2 style={{
              margin: "0 0 8px",
              color: "#f8fafc",
              fontSize: 24
            }}>
              {user?.name || "Anonymous Entity"}
            </h2>
            <div style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(0,217,255,0.2), rgba(255,0,110,0.2))",
              border: "1px solid rgba(0,217,255,0.3)",
              color: "#00d9ff",
              fontSize: 12,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1
            }}>
              {user?.role || "Digital Citizen"}
            </div>
          </div>

          {/* DATA FIELDS */}
          <div style={{
            display: "grid",
            gap: 15
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{ color: "rgba(248,250,252,0.7)" }}>Phone:</span>
              <span style={{ color: "#00d9ff", fontWeight: "bold" }}>
                {user?.phone || "Not Connected"}
              </span>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{ color: "rgba(248,250,252,0.7)" }}>Alamat:</span>
              <span style={{
                color: "#ff006e",
                fontWeight: "bold",
                textAlign: "right",
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {user?.address || "Void Coordinates"}
              </span>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{ color: "rgba(248,250,252,0.7)" }}>Cabang:</span>
              <span style={{ color: "#f8fafc", fontWeight: "bold" }}>
                {user?.branch ? `${user.branch.name} • ${user.branch.area}` : "Unassigned"}
              </span>
            </div>
          </div>
        </div>

        {/* EDIT FORM */}
        {isEditing && (
          <div className="hologram-card" style={{
            borderRadius: 25,
            padding: 25,
            marginBottom: 25
          }}>
            <div className="data-stream" />

            <h3 style={{
              margin: "0 0 20px",
              color: "#f8fafc",
              textAlign: "center"
            }}>
              Edit Identity Matrix
            </h3>

            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#00d9ff",
                  fontSize: 14,
                  fontWeight: "bold"
                }}>
                  Display Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 15,
                    borderRadius: 15,
                    border: "1px solid rgba(0,217,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#f8fafc",
                    outline: "none",
                    fontSize: 14,
                    backdropFilter: "blur(10px)"
                  }}
                  placeholder="Enter your digital identity..."
                />
                <small style={{
                  color: "rgba(248,250,252,0.6)",
                  fontSize: 12,
                  display: "block",
                  marginTop: 5
                }}>
                  This doesn't affect your login credentials.
                </small>
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#00d9ff",
                  fontSize: 14,
                  fontWeight: "bold"
                }}>
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 15,
                    borderRadius: 15,
                    border: "1px solid rgba(0,217,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#f8fafc",
                    outline: "none",
                    fontSize: 14,
                    backdropFilter: "blur(10px)"
                  }}
                  placeholder="Enter communication frequency..."
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#00d9ff",
                  fontSize: 14,
                  fontWeight: "bold"
                }}>
                  Alamat
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 15,
                    borderRadius: 15,
                    border: "1px solid rgba(0,217,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#f8fafc",
                    outline: "none",
                    fontSize: 14,
                    resize: "vertical",
                    backdropFilter: "blur(10px)"
                  }}
                  placeholder="Enter your dimensional coordinates..."
                />
              </div>

              {feedback && (
                <div style={{
                  padding: 12,
                  borderRadius: 10,
                  textAlign: "center",
                  background: feedback.includes("failed") ? "rgba(255,0,110,0.2)" : "rgba(0,217,255,0.2)",
                  border: `1px solid ${feedback.includes("failed") ? "#ff006e" : "#00d9ff"}`,
                  color: feedback.includes("failed") ? "#ff006e" : "#00d9ff"
                }}>
                  {feedback}
                </div>
              )}

              <div style={{
                display: "flex",
                gap: 15
              }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="nexus-button"
                  style={{
                    flex: 1,
                    padding: 15,
                    borderRadius: 15,
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  {isSaving ? "Update App..." : "Update Identity"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: 15,
                    borderRadius: 15,
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#f8fafc",
                    fontWeight: "bold",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENU ITEMS */}
        <div style={{
          display: "grid",
          gap: 15
        }}>
          {[
            {
              title: "Edit Profile",
              subtitle: "Rubah profile kamu",
              icon: "🧬",
              color: "#00d9ff"
            },
            {
              title: "Alamat Saya",
              subtitle: user?.address || "Tentukan alamat kamu.",
              icon: "🌌",
              color: "#ff006e"
            },
            {
              title: "Cabang",
              subtitle: user?.branch ? `${user.branch.name} • ${user.branch.area}` : "Branch nexus unavailable",
              icon: "🏛️",
              color: "#9b59b6"
            },
            {
              title: "Bantuan",
              subtitle: "Connect dengan Operatror",
              icon: "🔗",
              color: "#2ecc71"
            }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => handleMenuClick(item.title)}
              className="menu-item hologram-card"
              style={{
                padding: 20,
                borderRadius: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 15
              }}>
                <div style={{
                  width: 45,
                  height: 45,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${item.color}, rgba(255,255,255,0.2))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  boxShadow: `0 4px 15px ${item.color}40`
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontWeight: "bold",
                    color: "#f8fafc",
                    fontSize: 16
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    color: "rgba(248,250,252,0.6)",
                    fontSize: 12,
                    marginTop: 2
                  }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div style={{
                color: item.color,
                fontSize: 20,
                fontWeight: "bold"
              }}>
                ›
              </div>
            </div>
          ))}
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          style={{
            marginTop: 30,
            width: "100%",
            padding: 18,
            borderRadius: 20,
            border: "1px solid rgba(255, 0, 110, 0.5)",
            background: "linear-gradient(135deg, rgba(255,0,110,0.2), rgba(139,0,0,0.2))",
            color: "#ff006e",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)"
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 8px 25px rgba(255,0,110,0.3)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "";
            e.target.style.transform = "";
          }}
        >
          🚪 Keluar Aplikasi
        </button>
        {isChatOpen && (
          <ChatModal open={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}
      </div>
    </div>
  );
}