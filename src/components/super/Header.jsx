import { useState, useRef, useEffect } from "react";
import { FaUser, FaSun, FaWallet, FaHistory } from "../../assets/react-icons";
import LoadWalletModal from "./LoadWalletModel";
import TransferFundsModal from "./TransferFundsModal";
import WalletHistory from "./WalletHistory";
import { useDarkTheme } from "../../hooks/useDarkTheme";
import { FaMoon } from "react-icons/fa";
import UserDropdown from "./UserDropDown";
import { SuperModal } from "../utility/SuperModel";

export default function Header() {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const { isSuperDarkMode, toggleSuperTheme } = useDarkTheme();
  const [profile, setProfile] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfile(false);
      }
    };

    if (profile) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profile]);

  // Listen for wallet updates to refresh history
  useEffect(() => {
    const handleWalletUpdated = () => {
      console.log("📨 Wallet updated - refreshing history");
      setRefreshHistoryTrigger((prev) => prev + 1);
    };

    window.addEventListener("walletUpdated", handleWalletUpdated);
    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdated);
    };
  }, []);

  return (
    <header className="text-black bg-white dark:bg-transparent dark:text-adminOffWhite flex justify-between items-center px-6 py-3 rounded-t-lg shadow-sm">
      {/* Left: Welcome text */}
      <h2 className="text-sm font-bold">
        WELCOME TO Bandaru Software Solution Pvt. Ltd.
      </h2>

      {/* Right: Action Items */}
      <div className="flex items-center gap-4">
        {isSuperDarkMode ? (
          <FaSun
            className="text-xl text-black dark:text-adminOffWhite"
            onClick={toggleSuperTheme}
          />
        ) : (
          <FaMoon
            className="text-xl text-black dark:text-adminOffWhite"
            onClick={toggleSuperTheme}
          />
        )}

        {/* Wallet Button */}
        <button
          onClick={() => setIsWalletOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-[#1C72B9] via-[#3382BE] to-[#4392C0] text-white shadow-lg hover:shadow-xl hover:scale-105 transition duration-200 cursor-pointer"
          title="Open wallet to add funds"
        >
          <FaWallet className="text-lg" />
          <span>Wallet</span>
        </button>

        {/* View History Button */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition duration-200 cursor-pointer"
          title="View wallet transaction history"
        >
          <FaHistory className="text-lg" />
          <span>History</span>
        </button>

        {/* Transfer Funds Button */}
        <button
          onClick={() => setIsTransferOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition duration-200 cursor-pointer"
          title="Transfer funds to another user"
        >
          <span>💸</span>
          <span>Transfer</span>
        </button>

        {/* Profile Icon */}
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-b from-[#1c4ba1] to-[#002d62] flex items-center justify-center shadow-inner cursor-pointer"
          onClick={() => setProfile(!profile)}
        >
          <FaUser className="text-white text-xl" />
        </div>
      </div>

      {/* Modals */}
      {isWalletOpen && (
        <SuperModal onClose={() => setIsWalletOpen(false)}>
          <LoadWalletModal
            isOpen={true}
            onClose={() => setIsWalletOpen(false)}
            onSuccess={() => {
              setIsWalletOpen(false);
            }}
          />
        </SuperModal>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <SuperModal onClose={() => setIsHistoryOpen(false)}>
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-300 dark:border-gray-600">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📋 Wallet Transaction History
              </h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-2xl font-bold text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <WalletHistory refreshTrigger={refreshHistoryTrigger} />
          </div>
        </SuperModal>
      )}

      {/* Transfer Modal */}
      {isTransferOpen && (
        <SuperModal onClose={() => setIsTransferOpen(false)}>
          <TransferFundsModal
            isOpen={true}
            onClose={() => setIsTransferOpen(false)}
            onSuccess={() => {
              setIsTransferOpen(false);
              // Refresh wallet and history on successful transfer
              setRefreshHistoryTrigger((prev) => prev + 1);
            }}
          />
        </SuperModal>
      )}

      {/* User Dropdown */}
      {profile && <UserDropdown ref={dropdownRef} />}
    </header>
  );
}
