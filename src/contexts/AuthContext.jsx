import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { toast } from "react-toastify";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Decode JWT expiry without a library
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry - 30_000; // treat as expired 30s early
};

const getCachedUser = () => {
  try { return JSON.parse(localStorage.getItem("user_data")); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const cachedUser = getCachedUser();

  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser); // no loading flash if cache exists
  const [isAuthenticated, setIsAuthenticated] = useState(!!cachedUser);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState(null);

  // Enhanced token refresh timer with retry logic
  useEffect(() => {
    let refreshTimer;
    let retryCount = 0;
    const maxRetries = 3;

    const refreshTokenWithRetry = async () => {
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          console.log("No refresh token available");
          return;
        }

        console.log("Attempting token refresh...");
        const response = await authService.refreshToken(refreshToken);
        if (response.access_token) {
          localStorage.setItem("token", response.access_token);
          // Update refresh token if a new one is provided
          if (response.refresh_token) {
            localStorage.setItem("refresh_token", response.refresh_token);
          }
          retryCount = 0; // Reset retry count on success
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        retryCount++;

        if (retryCount >= maxRetries) {
          console.error("Max refresh retries reached, logging out");
          toast.warning("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 5000,
          });
          handleLogout();
        } else {
          console.log(`Retrying token refresh (${retryCount}/${maxRetries})`);
          // Retry after a delay
          setTimeout(refreshTokenWithRetry, 5000 * retryCount);
        }
      }
    };

    if (isAuthenticated) {
      // Refresh token every 25 minutes (5 minutes before 30-minute backend expiry)
      const refreshInterval = 25 * 60 * 1000;
      refreshTimer = setInterval(refreshTokenWithRetry, refreshInterval);
      // NOTE: do NOT call refreshTokenWithRetry() immediately here —
      // it fires an extra API call on every page refresh from cache
    }

    return () => clearInterval(refreshTimer);
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        handleLogout(false);
        return;
      }

      const cached = localStorage.getItem("user_data");
      const lastRevalidated = parseInt(localStorage.getItem("user_data_ts") || "0", 10);
      const REVALIDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

      if (cached && Date.now() - lastRevalidated < REVALIDATE_INTERVAL) {
        // Cache fresh — restore instantly, no API call
        setUser(JSON.parse(cached));
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Cache stale or missing — fetch fresh
      const userData = await authService.getCurrentUser();
      localStorage.setItem("user_data", JSON.stringify(userData));
      localStorage.setItem("user_data_ts", Date.now().toString());
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      handleLogout(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      console.log("Login response:", response);

      const username =
        credentials instanceof FormData
          ? credentials.get("username")
          : credentials.username;

      if (response?.message?.includes("OTP sent")) {
        // OTP flow: wait for OTP verification
        setPendingIdentifier(username);
        setIsOtpSent(true);
        return response;
      }

      // Direct login: token is in the response — set up auth state immediately
      if (response?.access_token) {
        localStorage.setItem("token", response.access_token);
        if (response.refresh_token) {
          localStorage.setItem("refresh_token", response.refresh_token);
        }
        localStorage.setItem("login_timestamp", Date.now().toString());
        const userData = await authService.getCurrentUser();
        localStorage.setItem("user_data", JSON.stringify(userData));
        localStorage.setItem("user_data_ts", Date.now().toString());
        setUser(userData);
        setIsAuthenticated(true);
        return { ...response, user: userData, _directLogin: true };
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);

      if (error.message?.includes("OTP sent")) {
        const username =
          credentials instanceof FormData
            ? credentials.get("username")
            : credentials.username;
        setPendingIdentifier(username);
        setIsOtpSent(true);
        return { message: error.message };
      }

      throw error;
    }
  };

  const verifyOtp = async (otp) => {
    try {
      if (!pendingIdentifier) {
        throw new Error("No pending login request");
      }

      const response = await authService.verifyOtp({
        identifier: pendingIdentifier,
        otp: otp,
      });

      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        if (response.refresh_token) {
          localStorage.setItem("refresh_token", response.refresh_token);
        }

        // Store login timestamp for session management
        localStorage.setItem("login_timestamp", Date.now().toString());

        // Get user profile and cache it
        const userData = await authService.getCurrentUser();
        localStorage.setItem("user_data", JSON.stringify(userData));
        localStorage.setItem("user_data_ts", Date.now().toString());
        setUser(userData);
        setIsAuthenticated(true);
        setIsOtpSent(false);
        setPendingIdentifier(null);

        // Success toast with user info
        toast.success(`🎉 Welcome back, ${userData.name || userData.email}!`, {
          position: "top-right",
          autoClose: 5000,
        });

        // Return success to let component handle navigation
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const handleLogout = (showToast = true) => {
    // Clear all auth-related data including cache
    authService.logout();
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_data_ts");
    setUser(null);
    setIsAuthenticated(false);
    setIsOtpSent(false);
    setPendingIdentifier(null);

    // Clear any pending toasts
    toast.dismiss();

    if (showToast) {
      toast.info("👋 You have been logged out successfully.", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    // Return success to let component handle navigation
    return { success: true };
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(
        error.message || "Failed to change password. Please try again."
      );
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      toast.success("Password reset instructions sent to your email!");
    } catch (error) {
      toast.error(
        error.message || "Failed to process request. Please try again."
      );
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      toast.success(
        "Password reset successful! Please login with your new password."
      );
      // Return success to let component handle navigation
      return { success: true };
    } catch (error) {
      toast.error(
        error.message || "Failed to reset password. Please try again."
      );
      throw error;
    }
  };

  // Complete demo login by loading user data and setting auth state
  const completeDemoLogin = async () => {
    try {
      const userData = await authService.getCurrentUser();
      localStorage.setItem("user_data", JSON.stringify(userData));
      localStorage.setItem("user_data_ts", Date.now().toString());
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Error completing demo login:", error);
      throw error;
    }
  };

  // Enhanced session activity monitoring with warnings
  useEffect(() => {
    let inactivityTimer;
    let warningTimer;
    const inactivityPeriod = 30 * 60 * 1000; // 30 minutes
    const warningPeriod = 25 * 60 * 1000; // 25 minutes (5 min warning)

    const showInactivityWarning = () => {
      toast.warning(
        "⚠️ You'll be logged out in 5 minutes due to inactivity. Move your mouse to stay logged in.",
        {
          position: "top-center",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          toastId: "inactivity-warning", // Prevent duplicate toasts
        }
      );
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);

      // Set warning timer
      warningTimer = setTimeout(showInactivityWarning, warningPeriod);

      // Set logout timer
      inactivityTimer = setTimeout(() => {
        handleLogout();
        toast.error(
          "🔐 Session expired due to inactivity. Please log in again.",
          {
            position: "top-center",
            autoClose: 8000,
          }
        );
      }, inactivityPeriod);
    };

    if (isAuthenticated) {
      // Monitor user activity
      const events = [
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "mousemove",
        "click",
      ];

      events.forEach((event) =>
        document.addEventListener(event, resetTimer, true)
      );
      resetTimer();

      return () => {
        events.forEach((event) =>
          document.removeEventListener(event, resetTimer, true)
        );
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
      };
    }
  }, [isAuthenticated]);

  // On tab focus: check token expiry locally — no API call
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        const token = localStorage.getItem("token");
        if (!token || isTokenExpired(token)) {
          handleLogout(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    isAuthenticated,
    isOtpSent,
    setIsOtpSent,
    pendingIdentifier,
    login,
    verifyOtp,
    completeDemoLogin,
    logout: handleLogout,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we prepare the Content
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
