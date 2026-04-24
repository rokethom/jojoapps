import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  FiMessageSquare,
  FiUsers,
  FiTruck,
  FiSend,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";

export default function AdminChat() {
  const nav = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [formMode, setFormMode] = useState("driver");
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("chat/history/");
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch chat history", error);
      showToast("Failed to load chat history", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chat) => {
    if (!chat?.room_id) {
      showToast("Cannot load messages for this conversation.", "error");
      return;
    }

    try {
      const res = await api.get(`chat/?room_id=${chat.room_id}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      setSelectedChat(chat);
      setOrderId(chat.order_id ? String(chat.order_id) : "");
      setCustomerId(chat.customer_id ? String(chat.customer_id) : "");
      setFormMode(chat.order_id ? "driver" : "customer");
    } catch (error) {
      console.error("Failed to load chat messages", error);
      showToast("Failed to load messages", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast("Please type a message.", "error");
      return;
    }

    if (!selectedChat && formMode === "driver" && !orderId.trim()) {
      showToast("Order ID is required for driver chat.", "error");
      return;
    }

    if (!selectedChat && formMode === "customer" && !customerId.trim()) {
      showToast("Customer ID is required for customer chat.", "error");
      return;
    }

    const payload = { message: message.trim() };
    if (selectedChat?.room_id) {
      payload.room_id = selectedChat.room_id;
      if (selectedChat.order_id) {
        payload.order_id = selectedChat.order_id;
      }
      if (selectedChat.customer_id) {
        payload.customer_id = selectedChat.customer_id;
      }
    } else if (formMode === "driver") {
      payload.order_id = parseInt(orderId, 10);
    } else {
      payload.customer_id = parseInt(customerId, 10);
      if (orderId.trim()) {
        payload.order_id = parseInt(orderId, 10);
      }
    }

    setSubmitting(true);
    try {
      await api.post("chat/", payload);
      showToast(selectedChat ? "Reply sent." : "Chat request sent successfully.", "success");
      setMessage("");
      await fetchHistory();
      if (selectedChat) {
        fetchMessages(selectedChat);
      } else if (payload.order_id) {
        const room = history.find((item) => item.order_id === payload.order_id);
        if (room) fetchMessages(room);
      }
    } catch (error) {
      console.error("Failed to send chat message", error);
      showToast("Unable to send chat message.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>Admin Chat</h1>
          <p style={subtitle}>View recent driver/customer conversation requests and start new support chats.</p>
        </div>
        <div style={headerActions}>
          <button style={ghostButton} onClick={() => nav("/admin")}>Go Back</button>
          <button style={primaryButton} onClick={fetchHistory}>
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ ...toastStyle, background: toast.type === "success" ? "#10b981" : "#ef4444" }}>
          {toast.message}
        </div>
      )}

      <div style={gridContainer}>
        <div style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={panelTitle}>Start New Chat</h2>
              <p style={panelSubtitle}>Open a customer support chat or a driver order chat.</p>
            </div>
          </div>

          <div style={formGroup}>
            <label style={label}>Conversation Type</label>
            <div style={segmentedControl}>
              <button
                type="button"
                style={formMode === "driver" ? activeSegment : segmentButton}
                onClick={() => setFormMode("driver")}
              >
                Driver
              </button>
              <button
                type="button"
                style={formMode === "customer" ? activeSegment : segmentButton}
                onClick={() => setFormMode("customer")}
              >
                Customer
              </button>
            </div>
          </div>

          {formMode === "customer" && (
            <div style={formGroup}>
              <label style={label}>Customer ID</label>
              <input
                style={input}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter customer id"
              />
            </div>
          )}

          <div style={formGroup}>
            <label style={label}>Order ID</label>
            <input
              style={input}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter order id (required for driver chat)"
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Message</label>
            <textarea
              style={textarea}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to start the chat"
            />
          </div>

          <button style={submitButton} onClick={handleSubmit} disabled={submitting}>
            <FiSend size={16} /> {submitting ? "Sending..." : selectedChat ? "Send Reply" : "Send Chat Request"}
          </button>
        </div>

        <div style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={panelTitle}>Recent Conversations</h2>
              <p style={panelSubtitle}>Tap an order to view message history.</p>
            </div>
          </div>

          <div style={tableWrap}>
            {loading ? (
              <div style={emptyState}>Loading conversations...</div>
            ) : history.length === 0 ? (
              <div style={emptyState}>No recent chat conversations found.</div>
            ) : (
              history.map((chat) => (
                <button
                  key={chat.room_id}
                  style={chatButton(selectedChat?.room_id === chat.room_id)}
                  onClick={() => fetchMessages(chat)}
                >
                  <div style={chatItemTop}>
                    <span style={chatOrder}>Order #{chat.order_code || chat.order_id || "Support"}</span>
                    <span style={chatStatus}>{chat.order_status || (chat.room_type === 'support' ? "Support" : "Unknown")}</span>
                  </div>
                  <div style={chatItemMeta}>
                    <span>{chat.customer_name || "Customer"}</span>
                    <span>{chat.driver_name || (chat.room_type === 'support' ? "Support" : "Driver")}</span>
                  </div>
                  <div style={chatPreview}>{chat.latest_message}</div>
                  <div style={chatMetaFooter}>
                    <span>{chat.latest_sender_type?.toUpperCase() || "USER"}</span>
                    <span>{new Date(chat.latest_time).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={panelTitle}>Conversation Details</h2>
              <p style={panelSubtitle}>
                {selectedChat ? `Chat ${selectedChat.room_type === 'support' ? 'Support' : 'Order'} #${selectedChat.order_code || selectedChat.order_id || selectedChat.room_id}` : 'Selected chat messages will appear here.'}
              </p>
            </div>
          </div>

          <div style={messageTimeline}>
            {!selectedChat ? (
              <div style={emptyState}>Select a chat to see the last messages.</div>
            ) : (
              messages.map((item) => (
                <div key={item.id} style={messageRow(item.sender_type)}>
                  <div style={messageBubble(item.sender_type)}>
                    <div style={messageMeta}>{item.sender_type.toUpperCase()}</div>
                    <div>{item.message}</div>
                    <div style={messageTime}>{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const title = {
  fontSize: 28,
  margin: 0,
};

const subtitle = {
  color: "var(--text-secondary)",
  marginTop: 8,
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const panel = {
  background: "var(--bg-card)",
  border: "1px solid var(--card-border)",
  borderRadius: 18,
  padding: 20,
  minHeight: 380,
  boxShadow: "0 12px 30px rgba(0,0,0,0.04)",
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 18,
};

const panelTitle = {
  margin: 0,
  fontSize: 18,
};

const panelSubtitle = {
  marginTop: 6,
  color: "var(--text-muted)",
  fontSize: 13,
};

const gridContainer = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 440px) minmax(320px, 520px) 1fr",
  gap: 24,
  alignItems: "start",
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 16,
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
};

const input = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  padding: "12px 14px",
  minHeight: 44,
  outline: "none",
};

const textarea = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  padding: "12px 14px",
  outline: "none",
  resize: "vertical",
};

const submitButton = {
  background: "#4f46e5",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  gap: 8,
  alignItems: "center",
  fontWeight: 600,
};

const ghostButton = {
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-primary)",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
};

const primaryButton = {
  background: "#111827",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  display: "inline-flex",
  gap: 8,
  alignItems: "center",
  cursor: "pointer",
  border: "none",
};

const toastStyle = {
  padding: "14px 18px",
  borderRadius: 14,
  color: "#fff",
  fontWeight: 500,
};

const segmentedControl = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
  background: "var(--bg-input)",
  borderRadius: 12,
  overflow: "hidden",
};

const segmentButton = {
  border: "none",
  background: "transparent",
  padding: "12px 16px",
  cursor: "pointer",
  color: "var(--text-secondary)",
};

const activeSegment = {
  ...segmentButton,
  background: "#4f46e5",
  color: "#fff",
};

const tableWrap = {
  display: "grid",
  gap: 10,
  maxHeight: 540,
  overflowY: "auto",
};

const emptyState = {
  minHeight: 240,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  textAlign: "center",
  padding: 20,
  borderRadius: 14,
  border: "1px dashed var(--border)",
};

const chatButton = (active) => ({
  width: "100%",
  textAlign: "left",
  background: active ? "rgba(99,102,241,0.12)" : "var(--bg-card)",
  border: active ? "1px solid #6366f1" : "1px solid var(--card-border)",
  borderRadius: 14,
  padding: 16,
  color: "var(--text-primary)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "grid",
  gap: 10,
});

const chatItemTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const chatOrder = {
  fontWeight: 700,
  color: "var(--text-heading)",
};

const chatStatus = {
  fontSize: 12,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const chatItemMeta = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 13,
  color: "var(--text-muted)",
};

const chatPreview = {
  color: "var(--text-primary)",
  fontSize: 14,
  lineHeight: 1.5,
};

const chatMetaFooter = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
  color: "var(--text-secondary)",
  marginTop: 12,
};

const messageTimeline = {
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  overflowY: "auto",
};

const messageRow = (senderType) => ({
  display: "flex",
  justifyContent: senderType === "admin" ? "flex-end" : "flex-start",
});

const messageBubble = (senderType) => ({
  maxWidth: "100%",
  background: senderType === "admin" ? "#4f46e5" : "var(--bg-card)",
  color: senderType === "admin" ? "#fff" : "var(--text-primary)",
  borderRadius: 18,
  padding: 14,
  lineHeight: 1.5,
  boxShadow: "0 12px 20px rgba(0,0,0,0.06)",
});

const messageMeta = {
  fontSize: 12,
  opacity: 0.8,
  marginBottom: 8,
};

const messageTime = {
  marginTop: 10,
  fontSize: 11,
  opacity: 0.7,
};
