import { useState, useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";
import WalletBalanceCard from "../../components/super/WalletBancedCard";
import WalletHistory from "../../components/super/WalletHistory";

const MyWallet = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    console.log("🔄 Wallet refresh triggered");
    setRefreshTrigger((prev) => prev + 1);
  };

  // Listen for wallet update events from other components
  useEffect(() => {
    const handleWalletUpdated = (e) => {
      console.log("📡 Received walletUpdated event");
      handleRefresh();
    };

    // Add listener
    window.addEventListener("walletUpdated", handleWalletUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdated);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallet balance and view transaction history
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            className="flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:shadow-lg transition"
            disabled
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div className="text-left">
                <p className="font-semibold">Withdraw</p>
                <p className="text-sm opacity-90">Coming soon</p>
              </div>
            </div>
            <FiArrowRight size={20} />
          </button>

          <button
            className="flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg hover:shadow-lg transition"
            disabled
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <p className="font-semibold">Statistics</p>
                <p className="text-sm opacity-90">View reports</p>
              </div>
            </div>
            <FiArrowRight size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Wallet Card - 1/3 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-4">
                Wallet Overview
              </h3>
              <WalletBalanceCard refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* Wallet Info Cards - 2/3 */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Loaded */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                  Total Loaded
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹0.00
                </p>
                <p className="text-xs text-gray-500 mt-2">All time total</p>
              </div>

              {/* Total Transactions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  0
                </p>
                <p className="text-xs text-gray-500 mt-2">Wallet transactions</p>
              </div>

              {/* Last Loaded */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                  Last Loaded
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹0.00
                </p>
                <p className="text-xs text-gray-500 mt-2">Most recent load</p>
              </div>

              {/* Account Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                  Account Status
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  Active
                </p>
                <p className="text-xs text-gray-500 mt-2">All systems operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                📋 Transaction History
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                View all your wallet transactions and activity
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <WalletHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyWallet;
