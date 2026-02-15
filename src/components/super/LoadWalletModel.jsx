import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import walletService from "../../services/walletService";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import { FiLoader } from "react-icons/fi";

export default function LoadWalletModal({ isOpen = true, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: "",
    remark: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount.trim() === "") {
      newErrors.amount = "Amount is required";
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Amount must be a valid number";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (formData.remark && formData.remark.length > 500) {
      newErrors.remark = "Remark cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);

      const result = await walletService.topupWallet(user.id, {
        amount: parseFloat(formData.amount),
        remark: formData.remark || "",
      });

      if (result.success) {
        toast.success(
          `₹${parseFloat(formData.amount).toFixed(2)} added to wallet successfully!`
        );
        setFormData({
          amount: "",
          remark: "",
        });
        
        // Call onSuccess callback first
        onSuccess?.();
        
        // Dispatch custom event to trigger refresh with small delay
        setTimeout(() => {
          console.log("📤 Dispatching walletUpdated event");
          window.dispatchEvent(new CustomEvent("walletUpdated", { 
            detail: { amount: parseFloat(formData.amount) } 
          }));
        }, 100);
        
        // Close modal after longer delay to ensure everything refreshes
        setTimeout(() => {
          onClose?.();
        }, 500);
      } else {
        toast.error(result.message || "Failed to load wallet");
      }
    } catch (err) {
      console.error("Error loading wallet:", err);
      toast.error("An error occurred while loading wallet");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-darkBlue rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-[#1C72B9] to-[#4392C0] px-6 py-4 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white">Load Wallet</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-600 dark:text-gray-400 font-medium">
                ₹
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={`w-full pl-8 pr-3 py-2 rounded border focus:outline-none focus:ring-2 transition dark:bg-darkInput dark:text-white ${
                  errors.amount
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500 dark:border-gray-600"
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-3 py-2 rounded border resize-none focus:outline-none focus:ring-2 transition dark:bg-darkInput dark:text-white ${
                errors.remark
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 dark:border-gray-600"
              }`}
              placeholder="Enter any additional notes (max 500 characters)"
              maxLength="500"
              disabled={loading}
            />
            <div className="flex justify-between mt-1">
              {errors.remark && (
                <p className="text-xs text-red-500">{errors.remark}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {formData.remark.length}/500
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-[#1C72B9] via-[#3382BE] to-[#4392C0] text-white shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition duration-200 flex items-center justify-center gap-2"
            >
              {loading && <FiLoader className="animate-spin text-lg" />}
              {loading ? "Adding..." : "✨ Add Funds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
