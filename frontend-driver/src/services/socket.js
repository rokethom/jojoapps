import API from "../api/axios";

export function createDriverWebSocket(onEvent) {
  const token = localStorage.getItem("access");
  if (!token) {
    console.warn("Driver websocket not created because no access token is available.");
    return null;
  }

  const baseUrl = API.defaults.baseURL ? new URL(API.defaults.baseURL).origin : `${window.location.protocol}//${window.location.hostname}:8000`;
  const socketUrl = baseUrl.replace(/^http/, "ws") + `/ws/driver${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const socket = new WebSocket(socketUrl);
  socket.shouldReconnect = true;

  socket.onopen = () => {
    console.info("Driver websocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "order_notification") {
        onEvent(data);
      }
    } catch (error) {
      console.error("WebSocket parse error", error);
    }
  };

  socket.onclose = (event) => {
    console.warn("Driver websocket closed", event.reason);
    if (socket.shouldReconnect) {
      setTimeout(() => createDriverWebSocket(onEvent), 2000);
    }
  };

  socket.onerror = (error) => {
    console.error("Driver websocket error", error);
    socket.close();
  };

  const originalClose = socket.close.bind(socket);
  socket.close = () => {
    socket.shouldReconnect = false;
    originalClose();
  };

  return socket;
}
