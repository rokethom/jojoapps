import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();

  const handleNav = (path) => {
    if (!token) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: "rgba(15, 15, 30, 0.85)",
        backdropFilter: "blur(15px)",
        borderTop: "1px solid rgba(0, 217, 255, 0.2)",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)"
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={location.pathname}
        sx={{
          background: "transparent",
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: "rgba(248, 250, 252, 0.5)",
            minWidth: 'auto',
            padding: '12px 0',
            transition: "all 0.3s ease",
            '&.Mui-selected': {
              color: "#00d9ff",
              '& .MuiSvgIcon-root': {
                filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))",
                transform: "scale(1.2) translateY(-2px)"
              }
            }
          }
        }}
      >
        <BottomNavigationAction 
          label="" 
          value="/"
          icon={<HomeIcon />} 
          onClick={() => handleNav("/")} 
        />
        {token && (
          <>
            <BottomNavigationAction 
              label="History" 
              value="/history"
              icon={<HistoryIcon />} 
              onClick={() => handleNav("/history")} 
            />
            <BottomNavigationAction 
              label="Profil" 
              value="/profile"
              icon={<PersonIcon />} 
              onClick={() => handleNav("/profile")} 
            />
          </>
        )}
      </BottomNavigation>
    </Paper>
  );
}
