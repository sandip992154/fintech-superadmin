import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { login, verifyOtp, isOtpSent } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      image:
        "https://static.vecteezy.com/system/resources/previews/003/001/886/non_2x/fintech-financial-technology-online-banking-and-crowdfunding-vector.jpg",
      title: "Secure Login",
      description: "Access your superadmin dashboard with enhanced security",
    },
    {
      image:
        "https://www.currencytransfer.com/wp-content/uploads/2024/09/blog-post-image-fintech1.jpg",
      title: "Complete Control",
      description: "Manage your entire system from one place",
    },
    {
      image:
        "https://www.chiratae.com/wp-content/uploads/2022/12/Indian-fintech-market-expected-to-reach-USD-150-bn-in-valuation-by-2025-MoS-Finance.jpg-1024x576.webp",
      title: "Advanced Features",
      description: "Access to powerful administrative tools",
    },
  ];

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);
      console.log("Starting login submission");

      // Convert to FormData as backend expects form data
      const formData = new FormData();
      formData.append("username", data.identifier);
      formData.append("password", data.password);

      const response = await login(formData);
      console.log("Login response in SignIn:", response);
      console.log("Is OTP sent after login:", isOtpSent);

      // Show success message
      if (response?.message?.includes("OTP sent")) {
        toast.success("OTP sent to your email. Please check and enter below.");
      } else {
        toast.success(response?.message || "Login successful!");
      }
    } catch (error) {
      console.error("Login error in SignIn:", error);

      // Don't show error for OTP sent message
      if (error.message?.includes("OTP sent")) {
        toast.success("OTP sent to your email. Please check and enter below.");
      } else {
        toast.error(error.message || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await verifyOtp(data.otp);
      toast.success(response.message);
      navigate(response.redirect_path || "/dashboard");
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to verify OTP. Please try again."
      );
      if (error.response?.status === 401) {
        // Optionally handle OTP resend or reset state here
      }
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
    <div className="flex h-screen">
      {/* Left Side - Slider */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full">
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-6">
                <h3 className="text-2xl font-bold mb-2">
                  {slides[currentSlide].title}
                </h3>
                <p>{slides[currentSlide].description}</p>
              </div>
            </div>
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your superadmin dashboard
            </p>
          </div>

          {!isOtpSent ? (
            <form
              onSubmit={handleLoginSubmit(onLoginSubmit)}
              className="mt-8 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email/Phone/Code
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...registerLogin("identifier")}
                      type="text"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email, phone or user code"
                    />
                  </div>
                  {loginErrors.identifier && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginErrors.identifier.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    {...registerLogin("password")}
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleOtpSubmit(onOtpSubmit)}
              className="mt-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <div className="mt-1">
                  <input
                    {...registerOtp("otp")}
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter OTP"
                  />
                  {otpErrors.otp && (
                    <p className="mt-1 text-sm text-red-600">
                      {otpErrors.otp.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {!isOtpSent && (
            <div className="mt-4 text-sm">
              <button
                onClick={() => navigate("/forgot-password")}
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
