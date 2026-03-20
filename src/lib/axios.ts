import axios from "axios";
import { clearAuthCookies } from "@/lib/cookies";

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://psearch.dveloxsoft.com/apiv1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're already refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add Authorization header from sessionStorage
apiClient.interceptors.request.use(
  (config) => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401 error and not the login or refresh endpoint
    const isAuthEndpoint = 
      originalRequest.url?.includes('/auth/login') || 
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/activate') ||
      originalRequest.url?.includes('/auth/send-confirmation-token');

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token, redirect to login
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          clearAuthCookies();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // Call the refresh endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "https://psearch.dveloxsoft.com/apiv1"}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Save new credentials
        if (typeof window !== "undefined") {
          sessionStorage.setItem("token", access_token);
          if (newRefreshToken) {
            sessionStorage.setItem("refresh_token", newRefreshToken);
          }
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queue with new token
        processQueue(null, access_token);

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear session and redirect to login
        processQueue(refreshError, null);
        
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          clearAuthCookies();
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For 401 on auth endpoints or other errors, just reject
    if (error.response?.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");
      clearAuthCookies();
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
