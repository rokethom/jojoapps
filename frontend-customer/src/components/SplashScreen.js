import { useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // 3 detik

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #0a0a1e 0%, #1a0033 50%, #2d004d 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}>
      <div style={{
        textAlign: "center",
        animation: "fadeIn 1s ease-in-out",
      }}>
        <img
          src={process.env.PUBLIC_URL + "/logo_splash.png"}
          alt="Splash Logo"
          style={{
            width: "200px",
            height: "200px",
            borderRadius: "20px",
            objectFit: "cover",
            marginBottom: "20px",
            boxShadow: "0 0 40px rgba(0, 217, 255, 0.5)",
          }}
        />
        <div style={{
          color: "#00d9ff",
          fontSize: "24px",
          fontWeight: "bold",
          textShadow: "0 0 15px rgba(0, 217, 255, 0.8)",
        }}>
          Jojo System
        </div>
        <div style={{
          color: "rgba(248, 250, 252, 0.6)",
          fontSize: "14px",
          marginTop: "10px",
        }}>
          Memuat aplikasi...
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}