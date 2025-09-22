import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState(null);
  const navigate = useNavigate();

  // Token refresh timer
  useEffect(() => {
    let refreshTimer;
    if (isAuthenticated) {
      const refreshInterval = 15 * 60 * 1000; // 15 minutes
      refreshTimer = setInterval(async () => {
        try {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            const response = await authService.refreshToken(refreshToken);
            if (response.access_token) {
              localStorage.setItem("token", response.access_token);
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          handleLogout();
        }
      }, refreshInterval);
    }
    return () => clearInterval(refreshTimer);
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      console.log("Login response:", response); // Debug log

      // Get username from credentials
      const username =
        credentials instanceof FormData
          ? credentials.get("username")
          : credentials.username;

      // If we get an OTP sent message, set up the OTP verification state
      if (response?.message?.includes("OTP sent")) {
        setPendingIdentifier(username);
        setIsOtpSent(true);
      }

      return response;
    } catch (error) {
      console.error("Login error:", error); // Debug log

      // Check if the error message indicates OTP was sent
      if (error.message?.includes("OTP sent")) {
        const username =
          credentials instanceof FormData
            ? credentials.get("username")
            : credentials.username;
        setPendingIdentifier(username);
        setIsOtpSent(true);
        return { message: error.message };
      }

      // Otherwise rethrow the error
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

        // Get user profile
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);

        navigate("/");
        toast.success("Login successful!");
      }
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
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
      navigate("/signin");
    } catch (error) {
      toast.error(
        error.message || "Failed to reset password. Please try again."
      );
      throw error;
    }
  };

  // Session activity monitoring
  useEffect(() => {
    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
        toast.warning("Session expired due to inactivity");
      }, 30 * 60 * 1000); // 30 minutes
    };

    if (isAuthenticated) {
      // Monitor user activity
      const events = ["mousedown", "keydown", "scroll", "touchstart"];
      events.forEach((event) => document.addEventListener(event, resetTimer));
      resetTimer();

      return () => {
        events.forEach((event) =>
          document.removeEventListener(event, resetTimer)
        );
        clearTimeout(inactivityTimer);
      };
    }
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    isAuthenticated,
    isOtpSent,
    setIsOtpSent,
    login,
    verifyOtp,
    logout: handleLogout,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
