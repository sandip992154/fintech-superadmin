import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import authService from "../services/authService";
import {
  LoadingButton,
  LoadingSpinner,
  ProgressBar,
} from "../components/ui/Loading";
import { Alert } from "../components/ui/Alert";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 2)
      return {
        score,
        label: "Weak",
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    if (score < 4)
      return {
        score,
        label: "Fair",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    if (score < 5)
      return {
        score,
        label: "Good",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      };
    return {
      score,
      label: "Strong",
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // Redirect to forgot password if no token
  if (!token) {
    navigate("/forgot-password");
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.resetPassword(
        token,
        data.password,
        data.confirmPassword
      );

      toast.success("🎉 Password reset successful! You can now sign in.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      navigate("/signin");
    } catch (error) {
      let errorMessage = "❌ Failed to reset password. Please try again.";

      if (error.response?.data?.detail?.includes("expired")) {
        errorMessage = "⏰ Reset link has expired. Please request a new one.";
      } else if (error.response?.data?.detail?.includes("invalid")) {
        errorMessage =
          "🚫 Invalid reset token. Please request a new reset link.";
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/src/assets/img/bandaru_pay_logo.png"
            alt="Bandaru Pay"
            className="h-12 w-auto mx-auto mb-4"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Password
            </h2>
            <p className="text-gray-600">
              Your new password must be different from previous used passwords
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern focus-ring pl-10 pr-12"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Password Strength
                    </span>
                    <span
                      className={`text-sm font-semibold ${passwordStrength.color}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <ProgressBar
                    progress={(passwordStrength.score / 5) * 100}
                    color={
                      passwordStrength.score <= 2
                        ? "error"
                        : passwordStrength.score === 3
                        ? "warning"
                        : "success"
                    }
                    size="md"
                    showPercentage={false}
                    animated={true}
                  />

                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1">
                    {[
                      {
                        check: password.length >= 8,
                        text: "At least 8 characters",
                      },
                      {
                        check: /[A-Z]/.test(password),
                        text: "One uppercase letter",
                      },
                      {
                        check: /[a-z]/.test(password),
                        text: "One lowercase letter",
                      },
                      { check: /[0-9]/.test(password), text: "One number" },
                      {
                        check: /[!@#$%^&*(),.?":{}|<>]/.test(password),
                        text: "One special character",
                      },
                    ].map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-xs"
                      >
                        {req.check ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            req.check ? "text-green-600" : "text-gray-500"
                          }
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <p className="text-sm">{errors.password.message}</p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="input-modern focus-ring pl-10 pr-12"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <p className="text-sm">{errors.confirmPassword.message}</p>
                </div>
              )}
            </div>

            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Resetting Password..."
              variant="success"
              size="md"
              fullWidth={true}
              disabled={isLoading || passwordStrength.score < 3}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Reset Password
            </LoadingButton>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/signin")}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your password will be encrypted and stored securely
            </p>
            <div className="flex justify-center items-center mt-2 space-x-4">
              <div className="flex items-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                AES Encrypted
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Secure Reset
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
