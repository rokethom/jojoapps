import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Branch from "./pages/Branch";
import Rekap from "./pages/Rekap";
import DriverRequests from "./pages/DriverRequests";
import AdminChat from "./pages/AdminChat";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/branch"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Branch />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/rekap"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Rekap />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/driver-requests"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DriverRequests />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/chat"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminChat />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;