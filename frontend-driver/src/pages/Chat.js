import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { createChatWebSocket } from "../services/chatSocket";

export default function Chat() {
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const customerName = searchParams.get('name') || (customerId ? `Customer ${customerId}` : "Support");
  const orderId = searchParams.get('order');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addMessageToChat = useCallback((msg) => {
    const formattedMsg = {
      text: msg.message,
      type: msg.sender_type === 'driver' ? 'me' : 'other',
      time: new Date(msg.created_at).toLocaleTimeString().slice(0, 5),
      name: msg.sender_type === 'driver' ? 'You' : customerName,
      id: Date.now() + Math.random() // Unique ID for animations
    };
    setMessages(prev => [...prev, formattedMsg]);
    setTimeout(scrollToBottom, 100);
  }, [customerName, scrollToBottom]);

  const fetchMessages = useCallback(async () => {
    try {
      let url = "/chat/";
      let isAdminSupport = false;
      
      if (customerId) {
        url = `/chat/?customer_id=${customerId}`;
      } else if (orderId) {
        url = `/chat/?order_id=${orderId}`;
      } else {
        // Driver-admin support chat (auto-create room if not exists)
        url = "/chat/driver_admin_chat/";
        isAdminSupport = true;
      }
      
      console.log('📡 Fetching from:', url);
      const res = await API.get(url);
      console.log('✅ Response:', res.data);
      
      // Handle different response formats
      const messagesList = isAdminSupport ? res.data.messages : res.data;
      
      // Set roomId for admin support chat
      if (isAdminSupport && res.data.room_id) {
        setRoomId(res.data.room_id);
      }
      
      const formattedMessages = messagesList.map(msg => ({
        text: msg.message,
        type: msg.sender_type === 'driver' ? 'me' : 'other',
        time: new Date(msg.created_at).toLocaleTimeString().slice(0,5),
        name: msg.sender_type === 'driver' ? 'You' : (customerId ? customerName : 'Support'),
        id: Date.now() + Math.random()
      }));
      console.log('📦 Formatted:', formattedMessages);
      setMessages(formattedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('❌ Fetch error:', err.response?.status, err.response?.data || err.message);
    }
  }, [customerId, orderId, customerName, scrollToBottom]);

  // Initialize WebSocket
  useEffect(() => {
    fetchMessages();
    
    wsRef.current = createChatWebSocket((msg) => {
      console.log("💬 New message via WebSocket:", msg);
      
      // Check if message is for this chat room
      if (customerId) {
        addMessageToChat(msg);
      }
      
      setWsConnected(true);
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [customerId, fetchMessages, addMessageToChat]);

  // Fallback polling if WebSocket fails
  useEffect(() => {
    if (!wsConnected && customerId) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [wsConnected, customerId, fetchMessages]);

  // Auto scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const messageText = input;
    setInput("");

    try {
      const data = { message: messageText };
      if (roomId) {
        // Use room_id for admin support chat
        data.room_id = roomId;
      } else if (customerId) {
        data.customer_id = parseInt(customerId);
      } else if (orderId) {
        data.order_id = parseInt(orderId);
      }
      console.log('📨 Sending:', data);
      await API.post("/chat/", data);
      console.log('✅ Message sent!');
      
      // Add message immediately if WebSocket not connected
      if (!wsConnected) {
        setTimeout(fetchMessages, 100);
      }
    } catch (err) {
      console.error('❌ Send error:', err.response?.status, err.response?.data || err.message);
      setInput(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 20,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          color: "#fff",
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          💬 {customerId ? `Chat dengan ${customerName}` : orderId ? `Chat Admin order #${orderId}` : "Chat dengan Support"}
        </h2>
        <div style={{
          fontSize: 12,
          opacity: 0.8,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: wsConnected ? "#10b981" : "#f59e0b",
            display: "inline-block"
          }}></span>
          {wsConnected ? "Terhubung" : "Menghubungkan..."}
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: "rgba(255, 255, 255, 0.05)",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: 40,
              fontSize: 16,
            }}
          >
            Belum ada pesan. Mulai percakapan! 🚀
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              style={{
                display: "flex",
                justifyContent: msg.type === 'me' ? "flex-end" : "flex-start",
                animation: "messageSlideIn 0.3s ease-out",
              }}
            >
              {/* AVATAR for other messages */}
              {msg.type === 'other' && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff6b6b, #ffa500)",
                  marginRight: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 14,
                  boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
                  flexShrink: 0,
                }}>
                  👤
                </div>
              )}

              <div
                style={{
                  maxWidth: "70%",
                  padding: 14,
                  borderRadius: msg.type === 'me' ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.type === 'me'
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : "rgba(255, 255, 255, 0.95)",
                  color: msg.type === 'me' ? "#fff" : "#333",
                  boxShadow: msg.type === 'me'
                    ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                    : "0 4px 12px rgba(0, 0, 0, 0.1)",
                  wordBreak: "break-word",
                  position: "relative",
                  animation: "bubbleAppear 0.4s ease-out",
                }}
              >
                {/* Message sender name */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 6,
                  opacity: 0.8,
                  color: msg.type === 'me' ? "rgba(255, 255, 255, 0.9)" : "#667eea"
                }}>
                  {msg.name}
                </div>

                {/* Message text */}
                <div style={{
                  fontSize: 15,
                  lineHeight: 1.4,
                  marginBottom: 8
                }}>
                  {msg.text}
                </div>

                {/* Message time */}
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    textAlign: "right",
                  }}
                >
                  {msg.time}
                </div>

                {/* Message tail */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    [msg.type === 'me' ? 'right' : 'left']: -8,
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: msg.type === 'me' ? "0 0 8px 8px" : "0 8px 8px 0",
                    borderColor: msg.type === 'me'
                      ? "transparent transparent transparent #667eea"
                      : "transparent #fff transparent transparent",
                  }}
                />
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              animation: "messageSlideIn 0.3s ease-out",
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff6b6b, #ffa500)",
              marginRight: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
              flexShrink: 0,
            }}>
              👤
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: "18px 18px 18px 4px",
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#667eea",
                animation: "typingDot 1.4s ease-in-out infinite",
              }}></div>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#667eea",
                animation: "typingDot 1.4s ease-in-out infinite 0.2s",
              }}></div>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#667eea",
                animation: "typingDot 1.4s ease-in-out infinite 0.4s",
              }}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          padding: 16,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Ketik pesan..."
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 25,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            outline: "none",
            background: "rgba(255, 255, 255, 0.9)",
            color: "#333",
            fontSize: 14,
            transition: "all 0.3s ease",
          }}
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: 14,
            borderRadius: 25,
            border: "none",
            background: loading || !input.trim() ? "rgba(255, 255, 255, 0.3)" : "linear-gradient(135deg, #667eea, #764ba2)",
            color: loading || !input.trim() ? "rgba(255, 255, 255, 0.6)" : "#fff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: 14,
            minWidth: 60,
            transition: "all 0.3s ease",
            boxShadow: loading || !input.trim() ? "none" : "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
        >
          {loading ? "..." : "Kirim"}
        </button>
      </div>

      {/* CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bubbleAppear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
