import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// PAGES
import Order from "./pages/Order";
import Driver from "./pages/Driver";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import BottomNav from "./components/BottomNav";
import NotificationToast from "./components/NotificationToast";
import { createDriverWebSocket } from "./services/socket";

// =========================
// SIMPLE AUTH GUARD
// =========================
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

// =========================
// LAYOUT WITH BOTTOM NAV
// =========================
const MainLayout = ({ children, notificationCount, onClearOrderNotifications }) => (
  <div style={{ paddingBottom: 80, minHeight: "100vh" }}>
    {children}
    <BottomNav notificationCount={notificationCount} onClearOrderNotifications={onClearOrderNotifications} />
  </div>
);

export default function App() {
  const [notification, setNotification] = useState(null);
  const [orderNotifications, setOrderNotifications] = useState(0);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));

  useEffect(() => {
    const handleAuthLogin = () => setAccessToken(localStorage.getItem("access"));
    window.addEventListener("auth-login", handleAuthLogin);
    return () => window.removeEventListener("auth-login", handleAuthLogin);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const ws = createDriverWebSocket((event) => {
      if (event.event === "new_order") {
        setOrderNotifications((prev) => prev + 1);
        setNotification({
          message: `Order ${event.order.order_code} telah dibuat di ${event.order.pickup_location}`,
          order: event.order,
        });
        window.dispatchEvent(new CustomEvent("driver-order-update", { detail: event.order }));
      }
    });

    return () => ws && ws.close();
  }, [accessToken]);

  useEffect(() => {
    const handleShowToast = (event) => {
      const payload = event.detail || {};
      setNotification({
        title: payload.title || "📣 Notifikasi",
        message: payload.message || "",
      });
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  const clearOrderNotifications = () => setOrderNotifications(0);

  return (
    <Router>
      <NotificationToast notification={notification} onClose={() => setNotification(null)} />
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* PRIVATE */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout notificationCount={orderNotifications} onClearOrderNotifications={clearOrderNotifications}>
                <Home />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/order"
          element={
            <PrivateRoute>
              <MainLayout notificationCount={orderNotifications} onClearOrderNotifications={clearOrderNotifications}>
                <Order />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <MainLayout notificationCount={orderNotifications} onClearOrderNotifications={clearOrderNotifications}>
                <Chat />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/chat/:customerId"
          element={
            <PrivateRoute>
              <MainLayout notificationCount={orderNotifications} onClearOrderNotifications={clearOrderNotifications}>
                <Chat />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/driver"
          element={
            <PrivateRoute>
              <MainLayout notificationCount={orderNotifications} onClearOrderNotifications={clearOrderNotifications}>
                <Driver />
              </MainLayout>
            </PrivateRoute>
          }
        />

      </Routes>
    </Router>
  );
}
