import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { createChatWebSocket } from "../services/chatSocket";

export default function Chat({ driverIdProp = null, orderProp = null, onClose = null }) {
  const params = useParams();
  const driverIdFromParams = driverIdProp || params?.driverId || null;
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [notification, setNotification] = useState("");
  const [sessionClosed, setSessionClosed] = useState(false);
  const [supportPending, setSupportPending] = useState(false);
  const navigate = useNavigate();
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wsRef = useRef(null);
  const driverId = driverIdFromParams;
  const driverName = searchParams.get('name') || (driverId ? `Driver ${driverId}` : "Support");
  const orderId = orderProp || searchParams.get('order');

  const addMessageToChat = useCallback((msg) => {
    const formattedMsg = {
      text: msg.message,
      type: msg.sender_type === 'customer' ? 'me' : 'other',
      time: new Date(msg.created_at).toLocaleTimeString().slice(0, 5),
      name: msg.sender_type === 'customer' ? 'You' : driverName,
      avatar: msg.sender_type === 'customer' ? '👤' : '🤖',
      id: Date.now() + Math.random() // Unique ID for animations
    };
    setMessages(prev => [...prev, formattedMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [driverName]);

  const addSystemMessage = useCallback((text) => {
    const formattedMsg = {
      text,
      type: 'system',
      time: new Date().toLocaleTimeString().slice(0, 5),
      name: 'System'
    };
    setMessages(prev => [...prev, formattedMsg]);
  }, []);

  const showNotification = useCallback((text) => {
    setNotification(text);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timeout = setTimeout(() => setNotification(""), 3500);
    return () => clearTimeout(timeout);
  }, [notification]);

  const handleSocketEvent = useCallback((eventData) => {
    if (eventData.type === 'chat_message') {
      addMessageToChat(eventData);
      if (eventData.sender_type !== 'customer') {
        showNotification(`Pesan masuk dari ${driverName}`);
      }
    }

    if (eventData.type === 'chat_queue') {
      addSystemMessage(eventData.message);
      if (eventData.event === 'approved') {
        setSupportPending(false);
        showNotification('Chat support disetujui. Anda dapat mengirim pesan sekarang.');
      }
      if (eventData.event === 'rejected') {
        setSupportPending(false);
        showNotification('Permintaan chat support ditolak oleh admin.');
      }
    }

    if (eventData.type === 'order_notification') {
      const driverLabel = eventData.driver_name ? ` oleh ${eventData.driver_name}` : '';
      let messageText = eventData.message;

      if (!messageText) {
        if (eventData.event === 'order_completed') {
          messageText = `Order selesai${driverLabel}. Sesi chat telah selesai.`;
        } else if (eventData.event === 'order_cancelled') {
          messageText = `Order dibatalkan${driverLabel}. Sesi chat ditutup.`;
        } else if (eventData.event === 'order_assigned') {
          messageText = `Order diterima${driverLabel || ' oleh driver'}. Anda dapat menghubungi driver sekarang.`;
        } else {
          messageText = 'Perubahan status order terjadi.';
        }
      }

      addSystemMessage(messageText);
      showNotification(messageText);
      if (['order_completed', 'order_cancelled'].includes(eventData.event)) {
        setSessionClosed(true);
        setTimeout(() => {
          if (typeof onClose === 'function') {
            onClose();
          } else {
            navigate('/history');
          }
        }, 1200);
      }
    }
  }, [addMessageToChat, addSystemMessage, driverName, showNotification, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const url = driverId ? `/chat/?customer_id=${driverId}` : "/chat/";
      console.log('📡 Fetching from:', url);
      const res = await API.get(url);
      console.log('✅ Response:', res.data);
      const formattedMessages = res.data.map(msg => ({
        text: msg.message,
        type: msg.sender_type === 'customer' ? 'me' : 'other',
        time: new Date(msg.created_at).toLocaleTimeString().slice(0, 5),
        name: msg.sender_type === 'customer' ? 'You' : (driverId ? driverName : 'Support'),
        avatar: msg.sender_type === 'customer' ? '👤' : '🤖'
      }));
      console.log('📦 Formatted:', formattedMessages);
      setMessages(formattedMessages);
    } catch (err) {
      console.error('❌ Fetch error:', err.response?.status, err.response?.data || err.message);
    }
  }, [driverId, driverName]);

  // Initialize WebSocket
  useEffect(() => {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes messageBounceIn {
        0% { opacity: 0; transform: scale(0.3) translateY(20px); }
        60% { opacity: 1; transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(0,217,255,0.3); }
        50% { box-shadow: 0 0 30px rgba(0,217,255,0.8); }
      }

      @keyframes liquidMorph {
        0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        50% { border-radius: 70% 30% 46% 54% / 30% 30% 70% 70%; }
        100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
      }

      @keyframes neuralPulse {
        0%, 100% { opacity: 0.1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.2); }
      }

      @keyframes avatarRotate {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
      }

      .message-bubble {
        animation: messageBounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }

      .message-bubble::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        border-radius: inherit;
        animation: liquidMorph 8s ease-in-out infinite;
      }

      .message-bubble.me {
        background: linear-gradient(135deg, #00d9ff, #1a0033);
        color: white;
        animation: glowPulse 2s ease-in-out infinite;
      }

      .message-bubble.other {
        background: linear-gradient(135deg, #ff006e, #2d004d);
        color: white;
      }

      .message-bubble.system {
        background: rgba(255,255,255,0.1);
        color: #cbd5e1;
        border: 1px dashed rgba(255,255,255,0.18);
        animation: none;
      }

      .neural-node {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #00d9ff;
        border-radius: 50%;
        animation: neuralPulse 3s ease-in-out infinite;
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px;
      }

      .typing-dot {
        width: 8px;
        height: 8px;
        background: #00d9ff;
        border-radius: 50%;
        animation: typingIndicator 1.4s ease-in-out infinite;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typingIndicator {
        0%, 60%, 100% { opacity: 0.4; transform: scale(0.8); }
        30% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    fetchMessages();
    
    wsRef.current = createChatWebSocket((msg) => {
      console.log("💬 New message via WebSocket:", msg);
      handleSocketEvent(msg);
      setWsConnected(true);
    });

    return () => {
      document.head.removeChild(style);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
}, [driverId, fetchMessages, handleSocketEvent]);

  // Fallback polling if WebSocket fails
  useEffect(() => {
    if (!wsConnected && driverId) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [wsConnected, driverId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sessionClosed || (!driverId && supportPending)) return;

    setLoading(true);
    const messageText = input;
    setInput("");

    try {
      const payload = { message: messageText };
      if (driverId) payload.customer_id = driverId;
      if (orderId) payload.order_id = orderId;
      const res = await API.post("/chat/", payload);

      if (res.status === 202) {
        setSupportPending(true);
        addSystemMessage(res.data.detail || 'Permintaan chat support terkirim. Tunggu approval admin.');
      } else {
        setSupportPending(false);
      }

      console.log('📨 Message sent');
    } catch (err) {
      console.error('❌ Send error:', err.response?.status, err.response?.data || err.message);
      setInput(messageText); // Restore input on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #2d004d 100%)",
      color: "#f8fafc"
    }}>

      {/* HEADER */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(15, 15, 30, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff006e, #2d004d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18
        }}>
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#f8fafc" }}>
            {driverName}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <small style={{
              color: wsConnected ? "#10b981" : "#f59e0b",
              fontSize: 12
            }}>
              {wsConnected ? "🔗 Connected" : "⏳ Connecting..."}
            </small>
            {driverId && (
              <small style={{ color: "#94a3b8", fontSize: 12 }}>
                Kamu terhubung oleh driver {driverName}
              </small>
            )}
          </div>
        </div>
      </div>
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 10,
        position: "relative",
        background: "linear-gradient(135deg, #0f0f1e 0%, #1a0033 50%, #2d004d 100%)"
      }}>
        {notification && (
          <div style={{
            position: 'sticky',
            top: 10,
            marginBottom: 12,
            zIndex: 10,
            padding: '10px 14px',
            borderRadius: 18,
            background: 'rgba(0, 217, 255, 0.16)',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            color: '#e0f2fe',
            textAlign: 'center',
            fontSize: 13,
            backdropFilter: 'blur(12px)'
          }}>
            {notification}
          </div>
        )}
        {/* Neural Network Background */}
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden"
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="neural-node"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.type === "me" ? "flex-end" : "flex-start",
            marginBottom: 16,
            position: "relative",
            zIndex: 1
          }}>

            {/* AVATAR */}
            {m.type === "other" && (
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff006e, #2d004d)",
                marginRight: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 16,
                boxShadow: "0 4px 12px rgba(255, 0, 110, 0.3)",
                animation: "avatarRotate 4s ease-in-out infinite"
              }}>
                🤖
              </div>
            )}

            <div className={`message-bubble ${m.type}`}>
              <div style={{
                position: "relative",
                zIndex: 2,
                fontSize: 14,
                lineHeight: 1.4
              }}>
                {m.type === 'system' ? <strong>{m.text}</strong> : m.text}
              </div>

              <div style={{
                fontSize: 10,
                marginTop: 6,
                textAlign: "right",
                opacity: 0.7,
                position: "relative",
                zIndex: 2
              }}>
                {m.time}
              </div>
            </div>

            {/* AVATAR ME */}
            {m.type === "me" && (
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00d9ff, #1a0033)",
                marginLeft: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 16,
                boxShadow: "0 4px 12px rgba(0, 217, 255, 0.3)",
                animation: "avatarRotate 4s ease-in-out infinite reverse"
              }}>
                👤
              </div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {loading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff006e, #2d004d)",
              marginRight: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 16
            }}>
              🤖
            </div>
            <div className="message-bubble other">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(15, 15, 30, 0.8)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        {sessionClosed && (
          <div style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 20,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(248,250,252,0.12)",
            color: "#f8fafc",
            fontSize: 13,
            textAlign: "center"
          }}>
            Sesi chat telah selesai. Anda tidak dapat mengirim pesan lagi.
          </div>
        )}
        {supportPending && !sessionClosed && (
          <div style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 20,
            background: "rgba(255, 229, 100, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            color: "#f8fafc",
            fontSize: 13,
            textAlign: "center"
          }}>
            Permintaan chat support telah dikirim. Tunggu admin menyetujui sesi chat.
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder={sessionClosed ? "Sesi chat selesai, tidak bisa mengirim pesan" : supportPending ? "Menunggu persetujuan admin..." : "Tulis pesan untuk driver..."}
            disabled={sessionClosed || supportPending}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: sessionClosed || supportPending ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.1)",
              color: "#f8fafc",
              outline: "none",
              fontSize: 14
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || sessionClosed || supportPending}
            style={{
              padding: "12px 20px",
              borderRadius: 20,
              border: "none",
              background: loading || sessionClosed || supportPending ? "#64748b" : "linear-gradient(135deg, #00d9ff, #1a0033)",
              color: "#f8fafc",
              fontWeight: "bold",
              cursor: loading || sessionClosed || supportPending ? "not-allowed" : "pointer",
              boxShadow: sessionClosed || supportPending ? "none" : "0 4px 12px rgba(0, 217, 255, 0.3)"
            }}
          >
            {loading ? "..." : sessionClosed ? "Tutup" : supportPending ? "Menunggu..." : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}

