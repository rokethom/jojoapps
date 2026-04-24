import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export default function Order() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      text: "Hai selamat datang di Jojo Aplikasi bot order. Kamu mau pesan apa hari ini? Silahkan pilih di bawah atau ketik langsung.",
      type: "other",
      time: new Date().toLocaleTimeString().slice(0, 5),
      isTyping: false,
      isInitial: true
    }
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes messageMorph {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        60% { opacity: 1; transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 10px rgba(0,217,255,0.2); }
        50% { box-shadow: 0 0 20px rgba(0,217,255,0.5); }
      }

      .message-bubble {
        animation: messageMorph 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        position: relative;
        max-width: 80%;
      }

      .service-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
        text-align: left;
        width: 100%;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .service-btn:hover {
        background: rgba(0, 217, 255, 0.2);
        border-color: #00d9ff;
        transform: translateX(5px);
      }

      .service-icon {
        width: 32px;
        height: 32px;
        background: #00d9ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 0 10px rgba(0, 217, 255, 0.4);
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        opacity: 0.6;
        animation: pulseGlow 1.4s ease-in-out infinite;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const sendMessage = async (textParam = null) => {
    const message = textParam || input;
    if (!message.trim()) return;

    const userMsg = {
      text: message,
      type: "me",
      time: new Date().toLocaleTimeString().slice(0, 5),
      isTyping: false
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Profile auto-fill logic
    let enrichedMessage = message;
    if (user && !message.includes("ya") && !message.includes("batal")) {
      const parts = [];
      if (user.name) parts.push(`nama ${user.name}`);
      if (user.phone) parts.push(`hp ${user.phone}`);
      // Alamat Antar (ke) removed as requested to be filled by user
      
      if (parts.length > 0) {
        enrichedMessage = `${message} ${parts.join(" ")}`;
      }
    }

    try {
      const res = await axios.post("chatbot/", {
        message: enrichedMessage
      });

      setTimeout(() => {
        const botMsg = {
          text: res.data.reply,
          type: "other",
          time: new Date().toLocaleTimeString().slice(0, 5),
          isTyping: false
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 800);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        text: "Gagal memproses pesan. Coba lagi ya.",
        type: "other",
        time: new Date().toLocaleTimeString().slice(0, 5)
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "#121212",
      color: "#fff",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* HEADER */}
      <div style={{
        padding: "20px",
        background: "rgba(30, 30, 30, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: 15
      }}>
        <div style={{
          width: 45,
          height: 45,
          borderRadius: "50%",
          background: "linear-gradient(45deg, #00d2ff 0%, #3a7bd5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24
        }}>🤖</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Jojo Assistant</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }}></div>
            <small style={{ color: "#4ade80" }}>Online</small>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.type === "me" ? "flex-end" : "flex-start",
            flexDirection: "column",
            alignItems: msg.type === "me" ? "flex-end" : "flex-start"
          }}>
            <div className="message-bubble" style={{
              padding: "14px 18px",
              borderRadius: msg.type === "me" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              background: msg.type === "me" ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
              border: msg.type === "me" ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: "pre-line"
            }}>
              {msg.text}

              {/* SERVICE OPTIONS (ONLY FOR INITIAL MESSAGE) */}
              {msg.isInitial && (
                <div style={{ marginTop: 20 }}>
                  <button className="service-btn" onClick={() => sendMessage("beli delivery order")}>
                    <div className="service-icon">🏠</div>
                    <span>Delivery Order</span>
                  </button>
                  <button className="service-btn" onClick={() => sendMessage("panggil ojek")}>
                    <div className="service-icon">🏍️</div>
                    <span>Ojek</span>
                  </button>
                  <button className="service-btn" onClick={() => sendMessage("kirim kurir")}>
                    <div className="service-icon">📦</div>
                    <span>Kurir</span>
                  </button>
                </div>
              )}

              {/* CONFIRMATION BUTTONS */}
              {msg.text.includes("Ketik ya") && (
                <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                  <button
                    onClick={() => sendMessage("ya")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "15px",
                      border: "none",
                      background: "#22c55e",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >✅ Konfirmasi</button>
                  <button
                    onClick={() => sendMessage("batal")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "15px",
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >❌ Batal</button>
                </div>
              )}
            </div>
            <small style={{ marginTop: 5, fontSize: 10, opacity: 0.5 }}>{msg.time}</small>
          </div>
        ))}
        {isTyping && (
          <div className="message-bubble" style={{
            alignSelf: "flex-start",
            padding: "5px 15px",
            borderRadius: "15px",
            background: "rgba(255, 255, 255, 0.05)"
          }}>
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{
        padding: "20px",
        background: "rgba(20, 20, 20, 0.95)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{
          display: "flex",
          gap: 12,
          background: "rgba(255, 255, 255, 0.05)",
          padding: "8px 15px",
          borderRadius: "30px",
          alignItems: "center"
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesanan Anda..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#fff",
              padding: "10px",
              outline: "none",
              fontSize: 14
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: input.trim() ? "#3b82f6" : "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}