import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout({ children }) {
  return (
    <div style={layout}>
      <Sidebar />
      <div style={content}>
        <Topbar />
        <main style={page}>{children}</main>
      </div>
    </div>
  );
}

const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-body)",
  transition: "background 0.3s ease",
};

const content = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const page = {
  flex: 1,
  padding: "24px 28px",
  overflowY: "auto",
};