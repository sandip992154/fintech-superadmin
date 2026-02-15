import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import walletService from "../../services/walletService";
import { toast } from "react-toastify";
import { FiAlertCircle, FiRefreshCw, FiPlus } from "react-icons/fi";

const WalletBalanceCard = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletExists, setWalletExists] = useState(true);
  const [creatingWallet, setCreatingWallet] = useState(false);

  // Fetch wallet balance on mount or when user changes or refresh is triggered
  useEffect(() => {
    if (user?.id) {
      fetchWalletBalance();
    }
  }, [user?.id, refreshTrigger]);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await walletService.getWalletBalance(user.id);

      if (result.success) {
        setBalance(result.data.balance);
        setWalletExists(true);
      } else {
        if (result.error === "wallet_not_found") {
          setWalletExists(false);
          setBalance(null);
        } else {
          setError(result.message);
          setWalletExists(true);
        }
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setError("Failed to load wallet balance");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setCreatingWallet(true);
      const result = await walletService.createWallet(user.id);

      if (result.success) {
        setBalance(0.0);
        setWalletExists(true);
        setError(null);
        toast.success("Wallet created successfully!");
        // Refresh balance after creation
        await fetchWalletBalance();
      } else {
        toast.error(result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error("Error creating wallet:", err);
      const errorMsg = "Failed to create wallet";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreatingWallet(false);
    }
  };

  // Error State - Wallet Doesn't Exist
  if (!walletExists && !loading) {
    return (
      <div className="relative bg-gradient-to-r from-[#FF6B6B] to-[#FF8787] text-white rounded-md overflow-hidden shadow-md p-4 h-32 w-full flex flex-col justify-center">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="text-xl" />
            <span className="font-semibold">Wallet Not Found</span>
          </div>
          <p className="text-sm mb-3">No wallet exists for your account. Create one to get started.</p>
          <button
            onClick={handleCreateWallet}
            disabled={creatingWallet}
            className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition duration-200"
          >
            <FiPlus className="text-lg" />
            {creatingWallet ? "Creating..." : "Create Wallet"}
          </button>
        </div>
      </div>
    );
  }

  // Error State - Other Errors
  if (error && walletExists && !loading) {
    return (
      <div className="relative bg-gradient-to-r from-[#FFA500] to-[#FFB84D] text-white rounded-md overflow-hidden shadow-md p-4 h-32 w-full flex flex-col justify-center">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="text-xl" />
            <span className="font-semibold">Error Loading Wallet</span>
          </div>
          <p className="text-sm mb-3">{error}</p>
          <button
            onClick={fetchWalletBalance}
            className="flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-50 hover:scale-105 transition duration-200"
          >
            <FiRefreshCw className="text-lg" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="relative bg-gradient-to-r from-[#1C72B9] to-[#4392C0] text-white rounded-md overflow-hidden shadow-md p-4 h-32 w-full flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="text-sm mt-2">Loading wallet...</p>
      </div>
    );
  }

  // Success State - Wallet Exists and Loaded
  return (
    <>
      <div className="relative bg-gradient-to-r from-[#1C72B9] to-[#4392C0] text-white rounded-md overflow-hidden shadow-md p-4 h-auto w-full flex flex-col justify-between">
        {/* Text content */}
        <div className="z-10">
          <div className="text-2xl font-bold">
            {balance !== null ? walletService.formatBalance(balance) : "₹0.00"}
          </div>
          <div className="text-sm mb-4">Wallet Balance</div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={fetchWalletBalance}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-blue-600 hover:scale-105 transition duration-200 shadow-md"
              title="Refresh balance"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* SVG Curve Overlay */}
        <svg
          className="absolute top-0 right-0 h-full w-auto z-0"
          viewBox="0 0 400 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <filter
              id="strong-shadow"
              x="-30%"
              y="-30%"
              width="250%"
              height="250%"
            >
              <feDropShadow
                dx="40"
                dy="0"
                stdDeviation="20"
                floodColor="#F8CB72"
                floodOpacity="1"
              />
            </filter>
          </defs>
          <path
            d="M120 200 C100 90 350 100 350 -10"
            stroke="#F8CB72"
            strokeWidth="6"
            fill="none"
            filter="url(#strong-shadow)"
          />
        </svg>
      </div>
    </>
  );
};

export default WalletBalanceCard;
