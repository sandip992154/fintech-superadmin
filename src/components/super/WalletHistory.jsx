import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import walletService from "../../services/walletService";
import { toast } from "react-toastify";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";

const WalletHistory = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });

  // Fetch wallet transactions on mount or when user changes or refresh is triggered
  useEffect(() => {
    if (user?.id) {
      console.log("📥 Component mounted/refreshed - fetching transactions");
      fetchWalletTransactions();
    }
  }, [user?.id, refreshTrigger]);

  // Refetch when pagination changes
  useEffect(() => {
    if (user?.id) {
      console.log(`📄 Pagination changed - offset: ${pagination.offset}, limit: ${pagination.limit}`);
      fetchWalletTransactions();
    }
  }, [pagination.offset, pagination.limit, user?.id]);

  const fetchWalletTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching wallet transactions...");
      const result = await walletService.getWalletTransactions(
        user.id,
        pagination.limit,
        pagination.offset
      );

      console.log("📡 API Response:", result);

      if (result.success && result.data) {
        // Data structure is now properly unwrapped as { transactions: [...], total_count: ... }
        const transactionsArray = result.data.transactions || [];
        const totalCount = result.data.total_count || 0;

        console.log("✅ Transactions loaded:", transactionsArray.length);
        console.log("📊 Total count:", totalCount);

        setTransactions(Array.isArray(transactionsArray) ? transactionsArray : []);
        setPagination((prev) => ({
          ...prev,
          total: totalCount,
        }));
      } else {
        const errorMsg = result.message || "Failed to load transactions";
        console.error("❌ Error:", errorMsg);
        setError(errorMsg);
        setTransactions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setError("Failed to load wallet history");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset - prev.limit,
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWalletTransactions();
    }
  }, [pagination.offset, pagination.limit]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Error State
  if (error && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-orange-500 mb-4">
          <FiAlertCircle className="text-xl" />
          <span className="font-semibold">Error Loading History</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchWalletTransactions}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded font-medium hover:bg-blue-600 transition"
        >
          <FiRefreshCw className="text-lg" />
          Retry
        </button>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg mb-2">No transactions yet</p>
          <p className="text-gray-400 text-sm">
            Load your wallet to see transactions here
          </p>
        </div>
      </div>
    );
  }

  // Transactions Table
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Wallet History</h3>
        <button
          onClick={fetchWalletTransactions}
          className="text-gray-600 hover:text-gray-800 transition"
          title="Refresh history"
        >
          <FiRefreshCw size={20} />
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Balance After
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Remark
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn?.id || Math.random()} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(txn?.created_at || new Date())}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (txn?.type || "").toLowerCase() === "credit"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {(txn?.type || "").toLowerCase() === "credit" ? "✓ Credit" : "✗ Debit"}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 text-sm font-semibold text-right ${
                    (txn?.type || "").toLowerCase() === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {(txn?.type || "").toLowerCase() === "credit" ? "+" : "-"}{formatAmount(txn?.amount || 0)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  {formatAmount(txn?.balance_after || 0)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {txn?.reference_id || "N/A"}
                  </code>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {txn?.remark ? (typeof txn.remark === 'string' && txn.remark.length > 50 
                    ? txn.remark.substring(0, 50) + "..." 
                    : txn.remark) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {transactions.map((txn) => (
          <div key={txn?.id || Math.random()} className="p-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-gray-900">
                {(txn?.type || "").toLowerCase() === "credit" ? "✓ Credit" : "✗ Debit"}
              </span>
              <span
                className={`font-bold text-lg ${
                  (txn?.type || "").toLowerCase() === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {(txn?.type || "").toLowerCase() === "credit" ? "+" : "-"}{formatAmount(txn?.amount || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {formatDate(txn?.created_at || new Date())}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <p className="text-gray-600">Balance After</p>
                <p className="font-semibold">{formatAmount(txn?.balance_after || 0)}</p>
              </div>
              <div>
                <p className="text-gray-600">Reference</p>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                  {txn?.reference_id || "N/A"}
                </code>
              </div>
            </div>
            {txn?.remark && (
              <div className="text-sm border-t border-gray-200 pt-2 mt-2">
                <p className="text-gray-600">Remark</p>
                <p className="text-gray-900">{txn.remark}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {pagination.offset + 1} to{" "}
          {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
          {pagination.total} transaction(s)
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={pagination.offset === 0}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={pagination.offset + pagination.limit >= pagination.total}
            className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletHistory;
