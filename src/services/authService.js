import apiClient from "./apiClient.js";

// Helper function for auth cleanup
function clearAuthAndRedirect() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/signin";
}

// Superadmin authentication service
const authService = {
  // Login with credentials
  login: async (formData) => {
    try {
      console.log("SuperAdminAuthService: Starting login request");
      const response = await apiClient.post("/auth/login", formData, {
        headers: {
          // Remove default Content-Type as browser will set it with boundary for FormData
          "Content-Type": undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error("SuperAdminAuthService: Login error:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        const errorMessage =
          error.response?.data?.detail || "Invalid credentials";
        throw new Error(errorMessage);
      } else if (error.response?.status === 403) {
        const errorMessage =
          error.response?.data?.detail || "Account access denied";
        throw new Error(errorMessage);
      } else if (error.response?.status === 422) {
        const errorMessage = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.join(", ")
          : error.response.data.detail || "Validation error";
        throw new Error(errorMessage);
      } else if (error.response?.data?.detail) {
        throw new Error(
          Array.isArray(error.response.data.detail)
            ? error.response.data.detail.join(", ")
            : error.response.data.detail
        );
      } else if (error.message) {
        throw new Error(error.message);
      }

      throw new Error("An unexpected error occurred during login");
    }
  },

  verifyOtp: async (data) => {
    try {
      console.log("SuperAdminAuthService: Starting OTP verification");
      const response = await apiClient.post("/auth/login-otp-verify", data);

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem("refresh_token", response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      console.error("SuperAdminAuthService: OTP verification error:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  // Login with form URL encoded data
  loginWithJson: async (data) => {
    const formData = new URLSearchParams();
    formData.append("username", data.identifier);
    formData.append("password", data.password);

    try {
      const response = await apiClient.post("/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (data) => {
    try {
      console.log("SuperAdminAuthService: Starting OTP verification");
      const response = await apiClient.post("/auth/login-otp-verify", {
        otp: data.otp,
        identifier: data.identifier,
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem("refresh_token", response.data.refresh_token);
        }
        localStorage.setItem("user_role", "super_admin");
        localStorage.setItem("userData", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error("SuperAdminAuthService: OTP verification error:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  // Demo login - bypasses OTP verification
  demoLogin: async () => {
    try {
      console.log("SuperAdminAuthService: Starting demo login");
      const formData = new FormData();
      formData.append("username", "superadmin");
      formData.append("password", "SuperAdmin@123");

      const response = await apiClient.post("/auth/demo-login", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      // Store tokens and user data
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("user_role", response.data.role);
      }

      console.log("SuperAdminAuthService: Demo login successful");
      return response.data;
    } catch (error) {
      console.error("SuperAdminAuthService: Demo login error:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw new Error(error.message);
      }
      throw new Error("Demo login failed");
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate token
  validateToken: async () => {
    try {
      const response = await apiClient.get("/auth/verify");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Password reset request - sends email with reset link
  forgotPassword: async (email, baseUrl = window.location.origin) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email,
        base_url: baseUrl,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword, confirmPassword) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh access token using refresh token
  refreshToken: async (refreshToken) => {
    try {
      console.log("SuperAdminAuthService: Starting token refresh");
      const response = await apiClient.post("/auth/refresh", {
        refresh_token: refreshToken,
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        // Update refresh token if a new one is provided
        if (response.data.refresh_token) {
          localStorage.setItem("refresh_token", response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      console.error("SuperAdminAuthService: Token refresh error:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  // Logout
  logout: () => {
    clearAuthAndRedirect();
  },
};

export { clearAuthAndRedirect };
export default authService;
