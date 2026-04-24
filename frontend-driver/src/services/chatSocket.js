import API from "../api/axios";
import notificationService from "../services/notificationService";

export function createChatWebSocket(onEvent) {
  const token = localStorage.getItem("access");
  if (!token) {
    console.warn("Chat websocket not created because no access token is available.");
    return null;
  }

  const baseUrl = API.defaults.baseURL ? new URL(API.defaults.baseURL).origin : `${window.location.protocol}//${window.location.hostname}:8000`;
  const socketUrl = baseUrl.replace(/^http/, "ws") + `/ws/chat?token=${encodeURIComponent(token)}`;
  
  console.log("🔌 Creating chat WebSocket:", socketUrl);
  const socket = new WebSocket(socketUrl);
  socket.shouldReconnect = true;

  socket.onopen = () => {
    console.info("✅ Chat websocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📨 WebSocket message received:", data);
      if (data?.type === "chat_message" || data?.type === "order_notification") {
        onEvent(data);
        try {
          const title = data.type === 'order_notification' ? 'Order Update' : 'Pesan Baru';
          const body = data.message || data.detail || '';
          notificationService.handleIncomingNotification({
            title,
            body,
            notification_type: data.type,
            priority: 2,
            data: data
          });
        } catch (e) {
          console.warn('Failed to send notification to notificationService', e);
        }
      }
    } catch (error) {
      console.error("❌ WebSocket parse error", error);
    }
  };

  socket.onclose = (event) => {
    console.warn("⚠️ Chat websocket closed", event.reason);
    if (socket.shouldReconnect) {
      console.log("🔄 Attempting to reconnect in 2s...");
      setTimeout(() => createChatWebSocket(onEvent), 2000);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ Chat websocket error", error);
    socket.close();
  };

  const originalClose = socket.close.bind(socket);
  socket.close = () => {
    socket.shouldReconnect = false;
    originalClose();
  };

  return socket;
}
