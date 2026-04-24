import BottomNav from "../components/BottomNav";
import FloatingNotificationButton from "../components/FloatingNotificationButton";

export default function MainLayout({ children }) {
  return (
    <div style={{ paddingBottom: "70px" }}>
      {children}

      <FloatingNotificationButton />

      <div style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        zIndex: 999,
        background: "#fff"
      }}>
        <BottomNav />
      </div>
    </div>
  );
}