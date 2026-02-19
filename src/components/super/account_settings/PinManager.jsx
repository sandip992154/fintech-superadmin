import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import apiClient from "../../../services/apiClient";

// ── constants ─────────────────────────────────────────────────────────────────
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes, must match backend

// ── validation schema ─────────────────────────────────────────────────────────
const schema = yup.object().shape({
  newPin: yup
    .string()
    .matches(/^\d{4}$/, "PIN must be exactly 4 digits")
    .required("New PIN is required"),
  confirmPin: yup
    .string()
    .oneOf([yup.ref("newPin")], "PINs do not match")
    .required("Confirm PIN is required"),
  otp: yup
    .string()
    .matches(/^\d{6}$/, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

// ── helper: format mm:ss ──────────────────────────────────────────────────────
const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ── component ─────────────────────────────────────────────────────────────────
const PinManager = ({ initialData, onSubmit, loading = false }) => {
  const [otpSent, setOtpSent]         = useState(false);
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown]     = useState(0); // seconds remaining
  const timerRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { newPin: "", confirmPin: "", otp: "", ...initialData },
    resolver: yupResolver(schema),
  });

  // ── countdown timer ──────────────────────────────────────────────────────────
  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_EXPIRY_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const isOtpExpired = otpSent && countdown === 0;

  // ── send / resend OTP ─────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const response = await apiClient.post("/profile/otp/generate", {
        purpose: "pin_change",
      });
      toast.success(response.data.message);
      setOtpSent(true);
      startCountdown();
    } catch (error) {
      console.error("Error sending OTP:", error);
      const detail = error.response?.data?.detail || error.message || "Failed to send OTP";
      toast.error(detail);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── submit PIN reset ──────────────────────────────────────────────────────────
  const handleFormSubmit = async (data) => {
    if (!onSubmit) return;

    const pinData = {
      new_pin:     data.newPin,
      confirm_pin: data.confirmPin,
      otp:         data.otp,
    };

    const result = await onSubmit(pinData);

    if (result?.success) {
      // ✅ Success — clean up all state and form
      setOtpVerified(true);
      setOtpSent(false);
      setCountdown(0);
      clearInterval(timerRef.current);
      reset({ newPin: "", confirmPin: "", otp: "" });
      // Briefly show success state, then reset button label
      setTimeout(() => setOtpVerified(false), 3000);
    }
    // Error toasts are already shown by useProfileManagement / handleMPINUpdate
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
    >
      {/* New PIN */}
      <div>
        <label className="block text-sm mb-1">New PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength="4"
          autoComplete="new-password"
          {...register("newPin")}
          className="w-full px-3 py-2 rounded dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-sm mt-1">{errors.newPin?.message}</p>
      </div>

      {/* Confirm PIN */}
      <div>
        <label className="block text-sm mb-1">Confirm PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength="4"
          autoComplete="new-password"
          {...register("confirmPin")}
          className="w-full px-3 py-2 rounded dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-sm mt-1">{errors.confirmPin?.message}</p>
      </div>

      {/* OTP */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm">
            OTP
            {otpSent && countdown > 0 && (
              <span className={`ml-2 text-xs font-mono ${
                countdown <= 60 ? "text-red-500" : "text-green-500"
              }`}>
                expires in {formatCountdown(countdown)}
              </span>
            )}
            {isOtpExpired && (
              <span className="ml-2 text-xs text-red-500">OTP expired — resend</span>
            )}
          </label>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className="text-xs text-violet-400 hover:underline disabled:opacity-50"
          >
            {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength="6"
          autoComplete="one-time-code"
          {...register("otp")}
          placeholder="Enter 6-digit OTP"
          className="w-full px-3 py-2 rounded dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-sm mt-1">{errors.otp?.message}</p>
      </div>

      {/* Submit */}
      <div className="md:col-span-3">
        <button
          type="submit"
          disabled={loading || isSubmitting || !otpSent || isOtpExpired}
          className="px-6 py-2 bg-secondary text-white rounded hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || isSubmitting
            ? "Processing..."
            : otpVerified
            ? "✓ PIN Updated!"
            : "Reset PIN"}
        </button>

        {!otpSent && (
          <p className="text-xs text-gray-500 mt-2">
            Please send OTP first to enable PIN reset
          </p>
        )}
        {isOtpExpired && (
          <p className="text-xs text-red-500 mt-2">
            OTP has expired. Please click Resend OTP to get a new code.
          </p>
        )}
      </div>
    </form>
  );
};

export default PinManager;
