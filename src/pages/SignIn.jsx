import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingButton, LoadingSpinner } from "../components/ui/Loading";
import { Alert } from "../components/ui/Alert";
import { authNotifications } from "../services/modernNotificationService";

// Validation Schema
const signInSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please enter a valid email, phone or user code"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const otpSchema = z.object({
  otp: z.string().min(4, "OTP must be at least 4 characters"),
});

export const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const { login, verifyOtp, isOtpSent } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      image: "/src/assets/img/bg-bank.jpg",
      title: "🔐 Secure Access",
      description:
        "Advanced security protocols protect your administrative dashboard",
      gradient: "from-blue-600 to-purple-600",
    },
    {
      image: "/src/assets/img/bg-recharge.jpg",
      title: "⚡ Complete Control",
      description:
        "Manage your entire fintech ecosystem from one centralized platform",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      image: "/src/assets/img/bg-travel.jpg",
      title: "🚀 Advanced Analytics",
      description:
        "Real-time insights and powerful administrative tools at your fingertips",
      gradient: "from-pink-600 to-red-600",
    },
  ];

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // OTP Timer
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    reset: resetOtpForm,
  } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);

      // Convert to FormData as backend expects form data
      const formData = new FormData();
      formData.append("username", data.identifier);
      formData.append("password", data.password);

      const response = await login(formData);

      // Handle successful login or OTP requirement
      if (response?.message?.includes("OTP sent")) {
        authNotifications.otpSent("email");
        setOtpTimer(120); // 2 minutes timer
        resetOtpForm();
      } else {
        authNotifications.loginSuccess(response?.user?.name || "User");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Friendly error messages
      if (error.message?.includes("Invalid credentials")) {
        authNotifications.loginError(
          "Invalid email/phone/code or password. Please check your credentials."
        );
      } else if (error.message?.includes("OTP sent")) {
        authNotifications.otpSent("email");
        setOtpTimer(120);
        resetOtpForm();
        return;
      } else if (error.message?.includes("Account locked")) {
        authNotifications.loginError(
          "Account temporarily locked. Please try again later or contact support."
        );
      } else if (error.message?.includes("Network")) {
        authNotifications.loginError(
          "Network error. Please check your connection and try again."
        );
      } else {
        authNotifications.loginError();
      }
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await verifyOtp(data.otp);

      authNotifications.loginSuccess("Welcome back!");

      navigate(response.redirect_path || "/dashboard");
    } catch (error) {
      console.error("OTP verification error:", error);

      if (error.message?.includes("expired")) {
        authNotifications.otpError(
          "OTP has expired. Please request a new one."
        );
      } else if (error.message?.includes("invalid")) {
        authNotifications.otpError();
      } else if (error.message?.includes("attempts")) {
        authNotifications.otpError(
          "Too many failed attempts. Please try again later."
        );
      } else {
        authNotifications.otpError();
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      // Trigger the login again to resend OTP
      const loginForm = document.querySelector("form");
      const formData = new FormData(loginForm);

      await login(formData);
      setOtpTimer(120);
      resetOtpForm();

      authNotifications.otpSent("email");
    } catch (error) {
      authNotifications.loginError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90 z-10"></div>
        <div className="relative z-20 flex flex-col justify-center items-center p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/src/assets/img/bandaru_pay_logo.png"
              alt="Bandaru Pay"
              className="h-16 w-auto"
            />
          </div>

          {/* Hero Content */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-md">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm">Bank-grade Security</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm">Multi-factor Authentication</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <User className="h-5 w-5 text-green-400" />
              <span className="text-sm">Role-based Access Control</span>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex space-x-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-white scale-110"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/src/assets/img/bandaru_pay_logo.png"
              alt="Bandaru Pay"
              className="h-12 w-auto mx-auto mb-4"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isOtpSent ? "Verify OTP" : "Welcome Back"}
              </h2>
              <p className="text-gray-600">
                {isOtpSent
                  ? "Enter the verification code sent to your email"
                  : "Sign in to access your superadmin dashboard"}
              </p>
            </div>

            {!isOtpSent ? (
              <form
                onSubmit={handleLoginSubmit(onLoginSubmit)}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">
                      Email / Phone / User Code
                    </label>
                    <div className="input-container">
                      <Mail className="input-icon h-5 w-5" />
                      <input
                        {...registerLogin("identifier")}
                        type="text"
                        className="input-modern focus-ring pl-28 pr-4"
                        placeholder="Enter your email, phone or user code"
                      />
                    </div>
                    {loginErrors.identifier && (
                      <div className="error-message">
                        <AlertCircle className="h-4 w-4" />
                        <p>{loginErrors.identifier.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-container">
                      <Lock className="input-icon h-5 w-5" />
                      <input
                        {...registerLogin("password")}
                        type={showPassword ? "text" : "password"}
                        className="input-modern focus-ring pl-12 pr-14"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <div className="error-message">
                        <AlertCircle className="h-4 w-4" />
                        <p>{loginErrors.password.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 text-sm text-gray-600"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Signing In..."
                  variant="primary"
                  size="md"
                  fullWidth={true}
                  disabled={loading}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Sign In Securely
                </LoadingButton>
              </form>
            ) : (
              <form
                onSubmit={handleOtpSubmit(onOtpSubmit)}
                className="space-y-6"
              >
                {/* OTP Timer */}
                {otpTimer > 0 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      ⏰ OTP expires in{" "}
                      <span className="font-semibold">
                        {Math.floor(otpTimer / 60)}:
                        {(otpTimer % 60).toString().padStart(2, "0")}
                      </span>
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <div className="input-container">
                    <Shield className="input-icon h-5 w-5" />
                    <input
                      {...registerOtp("otp")}
                      type="text"
                      maxLength={6}
                      className="input-modern focus-ring pl-12 pr-4 text-center text-lg font-mono tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  {otpErrors.otp && (
                    <div className="error-message">
                      <AlertCircle className="h-4 w-4" />
                      <p>{otpErrors.otp.message}</p>
                    </div>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Verifying..."
                  variant="success"
                  size="md"
                  fullWidth={true}
                  disabled={loading}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Verify & Continue
                </LoadingButton>

                {/* Resend OTP */}
                <div className="text-center space-y-3">
                  {otpTimer === 0 ? (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={loading}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                    >
                      📧 Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Didn't receive the code? You can resend in{" "}
                      {Math.floor(otpTimer / 60)}:
                      {(otpTimer % 60).toString().padStart(2, "0")}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtpTimer(0);
                      resetOtpForm();
                    }}
                    className="block w-full text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Protected by enterprise-grade security
            </p>
            <div className="flex justify-center items-center mt-2 space-x-4">
              <div className="flex items-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                SSL Encrypted
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                GDPR Compliant
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
