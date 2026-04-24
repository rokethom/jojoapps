import { create } from "zustand";
import API from "../api/axios";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("access"),

  login: async (username, password) => {
    const res = await API.post("/auth/login/", {
      username,
      password,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    const me = await API.get("/auth/me/");

    set({
      user: me.data,
      token: res.data.access,
    });
  },

  googleLogin: async (accessToken) => {
    const res = await API.post("/auth/google-login/", {
      access_token: accessToken,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    set({
      user: res.data.user,
      token: res.data.access,
    });

    return res.data;
  },

  register: async (username, password, name, phone, latitude, longitude, branchId) => {
    const payload = {
      username,
      password,
      name,
      phone,
    };
    
    // Include location if available
    if (latitude !== undefined && latitude !== null) {
      payload.latitude = latitude;
      console.log("📍 Location provided:", {latitude, longitude});
    }
    if (longitude !== undefined && longitude !== null) {
      payload.longitude = longitude;
    }
    
    // Include branch_id if manually selected (check for empty string too)
    if (branchId && branchId !== "" && branchId !== undefined && branchId !== null) {
      payload.branch_id = parseInt(branchId, 10);
      console.log("📌 Manual branch selected:", branchId);
    }
    
    console.log("📤 Registering with payload:", payload);
    
    try {
      const response = await API.post("/auth/register/", payload);
      console.log("✅ Registration successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Registration error:", error.response?.data || error.message);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    const res = await API.patch("/auth/me/", profileData);
    set({ user: res.data });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("access");
    set({ user: null, token: null });
    window.location.href = "/";
  },
}));