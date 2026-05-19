import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ??
  "https://api.ceothefirst.com/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Request Interceptor — attach admin token from Zustand store ────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — unwrap `data` field ─────────────────────

apiClient.interceptors.response.use(
  (response) => {
    // If the response has the wrapped format { success, data, timestamp },
    // unwrap and return only the `data` field
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError<{ message?: string; statusCode?: number }>) => {
    if (error.response?.status === 401) {
      // Use the store's logout to clear both Zustand state AND localStorage
      useAuthStore.getState().logout();

      // Only redirect if not already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
