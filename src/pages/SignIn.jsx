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
  Shield,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingButton } from "../components/ui/Loading";
import { authNotifications } from "../components/common/modernNotificationService";
import authService from "../services/authService";

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [storedCredentials, setStoredCredentials] = useState(null); // Store credentials for OTP resend
  const { login, verifyOtp, isOtpSent, setIsOtpSent, pendingIdentifier, completeDemoLogin } =
    useAuth();
  const navigate = useNavigate();

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

  // Fill Demo Credentials
  const handleDemoLogin = () => {
    setLoginValue("identifier", "superadmin");
    setLoginValue("password", "SuperAdmin@123");
    authNotifications.otpSent("Demo credentials loaded! Click Sign in to continue.");
  };

  // Submit form with demo endpoint
  const handleDemoSubmit = async () => {
    try {
      setLoading(true);
      
      // Use authService.demoLogin which has proper CORS configuration
      const response = await authService.demoLogin();

      // Complete the authentication in AuthContext
      await completeDemoLogin();

      authNotifications.loginSuccess(`Welcome ${response.role}!`);
      navigate("/");
    } catch (error) {
      authNotifications.loginError(error.message || "Demo login failed");
      console.error("Demo login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
    setValue: setLoginValue,
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

      // Store credentials for resend OTP functionality
      setStoredCredentials(data);

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

      // Handle specific backend error messages
      if (error.message?.includes("Incorrect password")) {
        authNotifications.loginError(
          "Incorrect password. Please check your password and try again."
        );
      } else if (error.message?.includes("User not found")) {
        authNotifications.loginError(
          "User not found. Please check your email/phone/code and try again."
        );
      } else if (error.message?.includes("incorrect credentials")) {
        authNotifications.loginError(
          "Invalid credentials. Please check your login details."
        );
      } else if (error.message?.includes("inactive")) {
        authNotifications.loginError(
          "Your account is inactive. Please contact support."
        );
      } else if (error.message?.includes("OTP sent")) {
        authNotifications.otpSent("email");
        setOtpTimer(120);
        resetOtpForm();
        return;
      } else if (
        error.message?.includes("Account locked") ||
        error.message?.includes("too many attempts")
      ) {
        authNotifications.loginError(
          "Account temporarily locked due to too many attempts. Please try again later."
        );
      } else if (error.message?.includes("Network")) {
        authNotifications.loginError(
          "Network error. Please check your connection and try again."
        );
      } else {
        // Show the actual backend error message if available, otherwise a generic message
        authNotifications.loginError(
          error.message || "Login failed. Please try again."
        );
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

      navigate("/");
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

      // Use the stored credentials to resend OTP
      if (!storedCredentials) {
        throw new Error("No stored credentials for resend");
      }

      // Convert to FormData as backend expects form data
      const formData = new FormData();
      formData.append("username", storedCredentials.identifier);
      formData.append("password", storedCredentials.password);

      const response = await login(formData);

      // Reset OTP timer and form
      setOtpTimer(120);
      resetOtpForm();

      authNotifications.otpSent("email");
    } catch (error) {
      console.error("Resend OTP error:", error);
      authNotifications.loginError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[600px]">
          {/* Left Side - Services Display */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 relative p-8 lg:p-12">
            <div className="relative z-10 flex flex-col justify-center text-white w-full">
              {/* Company Logo and Title */}
              <div className="text-center mb-8">
                <div className="w-30 h-30 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/bandaru_pay_logo.png"
                    alt="Bandaru Pay"
                    className="h-24 w-auto"
                  />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  Pay all your bills instantly with
                </h1>
                <h2 className="text-2xl lg:text-3xl font-bold text-yellow-300">
                  BandaruPay BBPS Services
                </h2>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {/* Row 1 */}
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Electricity</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Gas</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">DTH</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Water</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Broadband</span>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Mobile Recharge</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Loan EMI</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Credit Card Bill</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">Municipal Taxes</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs text-center">
                    Insurance Premiums
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-gray-50 to-white">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-6">
                <img
                  src="/bandaru_pay_logo.png"
                  alt="Bandaru Pay"
                  className="h-16 w-auto mx-auto mb-4"
                />
              </div>

              {/* Login Form Container */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="hidden w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full lg:flex items-center justify-center">
                    <img
                      src="/bandaru_pay_logo.png"
                      alt="Bandaru Pay"
                      className="h-8 w-auto brightness-0 invert"
                    />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                    {isOtpSent ? "Verify OTP" : "SuperAdmin Portal"}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {isOtpSent
                      ? "Enter the verification code sent to your email"
                      : "Welcome to Bandaru Pay!"}
                  </p>
                </div>

                {!isOtpSent ? (
                  <form
                    onSubmit={handleLoginSubmit(onLoginSubmit)}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            {...registerLogin("identifier")}
                            type="text"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-500"
                            placeholder="Enter your username"
                          />
                        </div>
                        {loginErrors.identifier && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <p>{loginErrors.identifier.message}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            {...registerLogin("password")}
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-500"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {loginErrors.password && (
                          <div className="mt-1 flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <p>{loginErrors.password.message}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Auto-Fill and Forgot Password */}
                    <div className="flex items-center justify-between text-sm gap-4">
                      <button
                        type="button"
                        onClick={handleDemoSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        {loading ? "Logging in..." : "Demo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={loading}
                      loadingText="Signing In..."
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                      disabled={loading}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Sign in
                    </LoadingButton>
                  </form>
                ) : (
                  <form
                    onSubmit={handleOtpSubmit(onOtpSubmit)}
                    className="space-y-5"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          {...registerOtp("otp")}
                          type="text"
                          maxLength={6}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-center text-lg font-mono tracking-widest text-gray-800"
                          placeholder="000000"
                        />
                      </div>
                      {otpErrors.otp && (
                        <div className="mt-1 flex items-center text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <p>{otpErrors.otp.message}</p>
                        </div>
                      )}
                    </div>

                    <LoadingButton
                      type="submit"
                      loading={loading}
                      loadingText="Verifying..."
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
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

                {/* Footer */}
                <div className="mt-8 text-center">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      BANDARU SOFTWARE SOLUTIONS PVT LTD
                    </h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>📧 contact@bandarupay.com</p>
                      <p>📞 Support: +91 7997991699</p>
                    </div>
                  </div>

                  <div className="flex justify-center items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      SSL Encrypted
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      GDPR Compliant
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
