import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import walletService from "../../services/walletService";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import { FiLoader } from "react-icons/fi";

export default function TransferFundsModal({ isOpen = true, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    to_user_id: "",
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

    // Validate recipient user ID
    if (!formData.to_user_id || formData.to_user_id.trim() === "") {
      newErrors.to_user_id = "Recipient user ID is required";
    } else if (isNaN(parseInt(formData.to_user_id))) {
      newErrors.to_user_id = "Recipient user ID must be a number";
    } else if (parseInt(formData.to_user_id) <= 0) {
      newErrors.to_user_id = "Recipient user ID must be greater than 0";
    }

    // Validate amount
    if (!formData.amount || formData.amount.trim() === "") {
      newErrors.amount = "Amount is required";
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Amount must be a valid number";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    // Validate remark
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

    setLoading(true);

    try {
      const result = await walletService.transferFunds(user.id, {
        to_user_id: parseInt(formData.to_user_id),
        amount: parseFloat(formData.amount),
        remark: formData.remark || "",
      });

      if (result.success) {
        toast.success(`✨ ${result.message}`);
        console.log("📨 Transfer successful, dispatching event");
        
        // Dispatch custom event for wallet update
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("walletUpdated", { detail: { amount: formData.amount } }));
        }, 100);

        // Reset form
        setFormData({
          to_user_id: "",
          amount: "",
          remark: "",
        });

        // Close modal after successful transfer
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 500);
      } else {
        toast.error(`❌ ${result.message || "Transfer failed"}`);
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("❌ An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          💸 Transfer Funds
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          <IoClose size={24} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient User ID Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipient User ID *
          </label>
          <input
            type="text"
            name="to_user_id"
            placeholder="Enter recipient user ID"
            value={formData.to_user_id}
            onChange={handleInputChange}
            disabled={loading}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.to_user_id
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {errors.to_user_id && (
            <p className="text-red-500 text-xs mt-1">{errors.to_user_id}</p>
          )}
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (₹) *
          </label>
          <input
            type="number"
            name="amount"
            placeholder="Enter amount to transfer"
            value={formData.amount}
            onChange={handleInputChange}
            disabled={loading}
            step="0.01"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.amount
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Remark Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Remark (Optional)
          </label>
          <textarea
            name="remark"
            placeholder="Add a note for this transfer (max 500 characters)"
            value={formData.remark}
            onChange={handleInputChange}
            disabled={loading}
            maxLength="500"
            rows="3"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.remark
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.remark.length}/500 characters
          </p>
          {errors.remark && (
            <p className="text-red-500 text-xs mt-1">{errors.remark}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Processing
              </>
            ) : (
              <>
                <span>💸 Transfer</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <span className="font-semibold">ℹ️ Info:</span> Transfers are instant and the recipient will receive the funds immediately. Both parties will see a transaction record.
        </p>
      </div>
    </div>
  );
}
