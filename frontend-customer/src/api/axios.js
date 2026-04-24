import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

// 🔥 FORCE BROWSER MODE
API.defaults.adapter = undefined;

// JWT Token Refresh Logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 🔥 AUTO INJECT TOKEN
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ensure JSON content type for POST requests
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem("access");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        API.post("/auth/refresh/", { refresh: refreshToken })
          .then(({ data }) => {
            localStorage.setItem("access", data.access);
            API.defaults.headers.common.Authorization = `Bearer ${data.access}`;
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            processQueue(null, data.access);
            resolve(API(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            window.location.href = "/login";
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default API;