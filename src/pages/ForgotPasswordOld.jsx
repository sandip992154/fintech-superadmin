import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from "lucide-react";
import { toast } from "react-toastify";
import authService from "../services/authService";
import { LoadingButton } from "../components/ui/Loading";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setEmailSent(true);

      toast.success("� Password reset email sent! Check your inbox.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (error) {
      let errorMessage = "❌ Something went wrong. Please try again.";

      if (error.response?.data?.detail?.includes("not found")) {
        errorMessage =
          "📧 Email address not found. Please check and try again.";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[600px]">
          {/* Left Side - Services Display */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 relative p-8 lg:p-12">
            <div className="relative z-10 flex flex-col justify-center text-white w-full">
              {/* Company Logo and Title */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/bandaru_pay_logo.png"
                    alt="Bandaru Pay"
                    className="h-12 w-auto"
                  />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  Secure Password Recovery
                </h1>
                <h2 className="text-xl lg:text-2xl font-semibold text-yellow-300">
                  Get back to your account safely
                </h2>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Bank-grade Security</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Encrypted Password Reset</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">24/7 Support Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Reset Form */}
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

              {/* Form Container */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    {emailSent ? (
                      <CheckCircle className="h-8 w-8 text-white" />
                    ) : (
                      <Mail className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                    {emailSent ? "Email Sent!" : "Reset Password"}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {emailSent
                      ? `Password reset link has been sent to ${email}. Check your inbox and click the link to reset your password.`
                      : "Enter your email address and we'll send you a password reset link"}
                  </p>
                </div>
          {!emailSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("email")}
                    type="email"
                    className="input-modern focus-ring pl-10 pr-4"
                    placeholder="Enter your registered email address"
                  />
                </div>
                {errors.email && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <p className="text-sm">{errors.email.message}</p>
                  </div>
                )}

                {/* Email Info */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-700 font-medium">
                        Reset Link
                      </p>
                      <p className="text-xs text-blue-600">
                        We'll send a secure password reset link to your
                        registered email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <LoadingButton
                type="submit"
                loading={isLoading}
                loadingText="Sending..."
                variant="warning"
                size="md"
                fullWidth={true}
                disabled={isLoading}
              >
                <Send className="h-5 w-5 mr-2" />
                Send Reset Link
              </LoadingButton>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Email Sent Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  Check your inbox and click the reset link to create a new
                  password.
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full btn-secondary"
              >
                Send Another Email
              </button>
            </div>
          )}

          {/* Back to Login */}
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
              Need help? Contact support for assistance
            </p>
            <div className="flex justify-center items-center mt-2 space-x-4">
              <div className="flex items-center text-xs text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                Secure Email
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fast Reset
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
