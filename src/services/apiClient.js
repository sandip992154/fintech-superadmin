import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle validation errors
    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.detail;
      if (validationErrors) {
        const errorMessage = Array.isArray(validationErrors)
          ? validationErrors.map((err) => err.msg || err).join(", ")
          : validationErrors;
        error.message = errorMessage;
      }
    }

    // Handle authentication errors with token refresh
    if (error.response?.status === 401) {
      // Don't try token refresh for login endpoints
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/login-otp-verify") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("refresh_token");

      // Try token refresh if we have a refresh token and haven't tried yet
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem("token", access_token);

          // Update the authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Token refresh failed - clear auth and redirect to login
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/signin";
          return Promise.reject(
            new Error("Session expired. Please login again.")
          );
        }
      }

      // No refresh token or refresh already failed - clear auth and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/signin";
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
