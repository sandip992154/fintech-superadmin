/**
 * PinManager — Secure 3-step PIN reset component
 *
 * FIX SUMMARY vs old version:
 *  1. Step-based UX: OTP is verified as a discrete step BEFORE PIN fields are
 *     shown. Previously the user could fill PIN fields without a verified OTP.
 *  2. PIN validation updated to 4–6 digits (was hard-coded to 4).
 *  3. "Verify OTP" API call is now explicit and gives clear per-step feedback.
 *  4. Resend is gated: button is disabled for 60 s after a send to prevent abuse.
 *  5. PIN fields are cleared from the DOM until OTP is verified — avoids
 *     accidental submission with stale data.
 *  6. Sensitive form fields use autoComplete="off" / "new-password" so browsers
 *     don't save PINs.
 *  7. onSubmit now only receives { new_pin, confirm_pin } — the OTP step is
 *     handled entirely inside this component (already verified in backend DB).
 */
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import apiClient from "../../../services/apiClient";

// ── constants ─────────────────────────────────────────────────────────────────
const OTP_EXPIRY_SECONDS = 5 * 60;   // must match backend _OTP_EXPIRY_MINUTES
const OTP_RESEND_COOLDOWN = 60;       // seconds the user must wait before resend

// ── steps ─────────────────────────────────────────────────────────────────────
const STEP = {
  IDLE:           "idle",         // initial — show Send OTP button
  OTP_SENT:       "otp-sent",     // OTP sent — show OTP input + Verify button
  OTP_VERIFIED:   "otp-verified", // OTP verified — show new PIN form
};

// ── yup schemas (one per step) ────────────────────────────────────────────────
const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .matches(/^\d{6}$/, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

// BUG FIX: was /^\d{4}$/ — PIN spec requires 4-6 numeric digits.
const pinSchema = yup.object().shape({
  newPin: yup
    .string()
    .matches(/^\d{4,6}$/, "PIN must be 4–6 digits")
    .required("New PIN is required"),
  confirmPin: yup
    .string()
    .oneOf([yup.ref("newPin")], "PINs do not match")
    .required("Confirm PIN is required"),
});

// ── helper: format mm:ss ──────────────────────────────────────────────────────
const fmt = (secs) =>
  `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

// ── component ─────────────────────────────────────────────────────────────────
const PinManager = ({ onSubmit, loading = false }) => {
  const [step, setStep]               = useState(STEP.IDLE);
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifying]  = useState(false);
  const [pinSuccess, setPinSuccess]   = useState(false);
  const [countdown, setCountdown]     = useState(0);   // OTP expiry countdown
  const [resendCooldown, setResend]   = useState(0);   // resend gate countdown
  const expiryTimer  = useRef(null);
  const resendTimer  = useRef(null);

  // ── OTP form ─────────────────────────────────────────────────────────────────
  const otpForm = useForm({
    resolver: yupResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // ── PIN form ─────────────────────────────────────────────────────────────────
  const pinForm = useForm({
    resolver: yupResolver(pinSchema),
    defaultValues: { newPin: "", confirmPin: "" },
  });

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearInterval(expiryTimer.current);
    clearInterval(resendTimer.current);
  }, []);

  const isOtpExpired = step === STEP.OTP_SENT && countdown === 0;

  // ── start OTP expiry countdown ────────────────────────────────────────────────
  const startExpiry = () => {
    clearInterval(expiryTimer.current);
    setCountdown(OTP_EXPIRY_SECONDS);
    expiryTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(expiryTimer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── start resend cooldown (prevents spam) ────────────────────────────────────
  const startResendCooldown = () => {
    clearInterval(resendTimer.current);
    setResend(OTP_RESEND_COOLDOWN);
    resendTimer.current = setInterval(() => {
      setResend((prev) => {
        if (prev <= 1) { clearInterval(resendTimer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── STEP 1: send / resend OTP ─────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await apiClient.post("/pin/send-otp");
      toast.success(res.data?.message || "OTP sent to your registered email.");
      setStep(STEP.OTP_SENT);
      otpForm.reset({ otp: "" });
      startExpiry();
      startResendCooldown();
    } catch (err) {
      // Show backend detail only when it is not a server/internal error to
      // avoid leaking stack traces. 429 and 4xx messages are safe to display.
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status && status < 500 && detail) {
        toast.error(detail);
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── STEP 2: verify OTP ────────────────────────────────────────────────────────
  const handleVerifyOtp = otpForm.handleSubmit(async (data) => {
    setVerifying(true);
    try {
      const res = await apiClient.post("/pin/verify-otp", { otp: data.otp });
      toast.success(res.data?.message || "OTP verified. Please set your new PIN.");
      setStep(STEP.OTP_VERIFIED);
      clearInterval(expiryTimer.current); // stop expiry timer — it's verified
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status && status < 500 && detail) {
        toast.error(detail);
      } else {
        toast.error("OTP verification failed. Please try again.");
      }
      // If OTP was invalidated (429 or explicit expiry message), reset to idle
      if (status === 429 || (detail && detail.toLowerCase().includes("no longer valid"))) {
        setStep(STEP.IDLE);
        otpForm.reset({ otp: "" });
      }
    } finally {
      setVerifying(false);
    }
  });

  // ── STEP 3: reset PIN ─────────────────────────────────────────────────────────
  const handlePinSubmit = pinForm.handleSubmit(async (data) => {
    if (!onSubmit) return;

    // onSubmit now only needs new_pin + confirm_pin.
    // The OTP was already verified in step 2 (backend stores the verified flag).
    const result = await onSubmit({
      new_pin:     data.newPin,
      confirm_pin: data.confirmPin,
    });

    if (result?.success) {
      setPinSuccess(true);
      pinForm.reset({ newPin: "", confirmPin: "" });
      // Give user a moment to see the success state, then return to idle
      setTimeout(() => {
        setPinSuccess(false);
        setStep(STEP.IDLE);
      }, 2500);
    }
    // Error toasts are shown by the parent hook (useProfileManagement)
  });

  // ── render helpers ────────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2 rounded dark:text-white border border-gray-600 focus:outline-none focus:border-violet-400";
  const btnPrimary =
    "px-6 py-2 bg-secondary text-white rounded hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed";

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Step indicator ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        {[["1", "Send OTP"], ["2", "Verify OTP"], ["3", "Set PIN"]].map(
          ([num, label], i) => {
            const stepIndex = [STEP.IDLE, STEP.OTP_SENT, STEP.OTP_VERIFIED].indexOf(step);
            const active = i === stepIndex;
            const done   = i < stepIndex || pinSuccess;
            return (
              <span key={num} className="flex items-center gap-1">
                <span
                  className={`w-5 h-5 rounded-full text-center text-xs leading-5 font-bold
                    ${done ? "bg-green-500 text-white"
                           : active ? "bg-violet-500 text-white"
                                    : "bg-gray-600 text-gray-300"}`}
                >
                  {done ? "✓" : num}
                </span>
                <span className={active ? "text-violet-400 font-medium" : ""}>{label}</span>
                {i < 2 && <span className="text-gray-600">→</span>}
              </span>
            );
          }
        )}
      </div>

      {/* ── STEP 1: Idle ────────────────────────────────────────────────────── */}
      {step === STEP.IDLE && (
        <div>
          <p className="text-sm text-gray-400 mb-3">
            Click <strong>Send OTP</strong> to receive a verification code on
            your registered email address.
          </p>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className={btnPrimary}
          >
            {sendingOtp ? "Sending…" : "Send OTP"}
          </button>
        </div>
      )}

      {/* ── STEP 2: OTP sent ────────────────────────────────────────────────── */}
      {step === STEP.OTP_SENT && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">
                Enter OTP
                {countdown > 0 && (
                  <span className={`ml-2 text-xs font-mono
                    ${countdown <= 60 ? "text-red-500" : "text-green-500"}`}>
                    expires in {fmt(countdown)}
                  </span>
                )}
                {isOtpExpired && (
                  <span className="ml-2 text-xs text-red-500 font-normal">
                    OTP expired
                  </span>
                )}
              </label>

              {/* Resend button — gated by cooldown to prevent spam */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || resendCooldown > 0}
                className="text-xs text-violet-400 hover:underline disabled:opacity-40"
              >
                {sendingOtp
                  ? "Sending…"
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              {...otpForm.register("otp")}
              className={inputClass}
              disabled={isOtpExpired}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-red-500 text-sm mt-1">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || isOtpExpired}
              className={btnPrimary}
            >
              {verifyingOtp ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(STEP.IDLE); setCountdown(0); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>

          {isOtpExpired && (
            <p className="text-xs text-red-500">
              Your OTP has expired. Click <em>Resend OTP</em> to get a new one.
            </p>
          )}
        </div>
      )}

      {/* ── STEP 3: OTP verified — PIN form ─────────────────────────────────── */}
      {step === STEP.OTP_VERIFIED && (
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <p className="text-sm text-green-500 font-medium">
            ✓ OTP verified. Please set your new PIN below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New PIN */}
            <div>
              <label className="block text-sm mb-1">New PIN (4–6 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="new-password"
                placeholder="Enter new PIN"
                {...pinForm.register("newPin")}
                className={inputClass}
              />
              {pinForm.formState.errors.newPin && (
                <p className="text-red-500 text-sm mt-1">
                  {pinForm.formState.errors.newPin.message}
                </p>
              )}
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-sm mb-1">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="new-password"
                placeholder="Re-enter new PIN"
                {...pinForm.register("confirmPin")}
                className={inputClass}
              />
              {pinForm.formState.errors.confirmPin && (
                <p className="text-red-500 text-sm mt-1">
                  {pinForm.formState.errors.confirmPin.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <button
              type="submit"
              disabled={loading || pinForm.formState.isSubmitting}
              className={btnPrimary}
            >
              {loading || pinForm.formState.isSubmitting
                ? "Processing…"
                : pinSuccess
                ? "✓ PIN Updated!"
                : "Reset PIN"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(STEP.IDLE); pinForm.reset(); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500">
            PIN must be 4–6 numeric digits and must differ from your current PIN.
          </p>
        </form>
      )}
    </div>
  );
};

export default PinManager;
