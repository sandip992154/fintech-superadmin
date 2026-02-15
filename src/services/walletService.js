import apiClient from "./apiClient";

class WalletService {
  /**
   * Get wallet balance for a specific user
   */
  async getWalletBalance(userId) {
    try {
      const response = await apiClient.get(`/transactions/wallet/${userId}`);
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      
      // Check if wallet doesn't exist
      if (error.response?.status === 404) {
        return {
          success: false,
          data: null,
          error: "wallet_not_found",
          message: "Wallet does not exist for this user. Please create a wallet first.",
        };
      }
      
      return {
        success: false,
        data: null,
        error: error.response?.data?.detail || error.message || "Failed to fetch wallet balance",
        message: error.response?.data?.detail || "An error occurred while fetching wallet balance",
      };
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId) {
    try {
      const response = await apiClient.post("/transactions/wallet/create", {
        user_id: userId,
      });
      return {
        success: true,
        data: response.data,
        error: null,
        message: "Wallet created successfully!",
      };
    } catch (error) {
      console.error("Error creating wallet:", error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.detail || error.message || "Failed to create wallet",
        message: error.response?.data?.detail || "An error occurred while creating wallet",
      };
    }
  }

  /**
   * Top up wallet with amount and optional remark
   */
  async topupWallet(userId, data) {
    try {
      const response = await apiClient.post(`/transactions/wallet/topup/${userId}`, {
        amount: parseFloat(data.amount),
        remark: data.remark || "",
      });
      return {
        success: true,
        data: response.data,
        error: null,
        message: "Wallet topped up successfully!",
      };
    } catch (error) {
      console.error("Error topping up wallet:", error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.detail || error.message || "Failed to topup wallet",
        message: error.response?.data?.detail || "An error occurred while topping up wallet",
      };
    }
  }

  /**
   * Get wallet transactions history
   */
  async getWalletTransactions(userId, limit = 10, offset = 0) {
    try {
      const response = await apiClient.get(`/transactions/wallet/${userId}/transactions`, {
        params: { limit, offset },
      });
      // Backend already returns { success: true, data: { transactions: [...], ... } }
      // So we return it as-is with proper structure
      if (response.data && response.data.data) {
        return {
          success: response.data.success || true,
          data: {
            transactions: response.data.data.transactions || [],
            total_count: response.data.data.total_count || 0,
            wallet_balance: response.data.data.wallet_balance,
            wallet_id: response.data.data.wallet_id,
            limit: response.data.data.limit || limit,
            offset: response.data.data.offset || offset
          },
          error: null,
          message: "Transactions fetched successfully",
        };
      }
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.detail || error.message || "Failed to fetch transactions",
        message: error.response?.data?.detail || "An error occurred while fetching transactions",
      };
    }
  }

  /**
   * Transfer funds to another user's wallet
   */
  async transferFunds(userId, transferData) {
    try {
      const response = await apiClient.post(`/transactions/wallet/transfer/${userId}`, {
        amount: parseFloat(transferData.amount),
        to_user_id: transferData.to_user_id,
        remark: transferData.remark || "",
      });
      return {
        success: true,
        data: response.data,
        error: null,
        message: response.data.message || "Transfer successful",
      };
    } catch (error) {
      console.error("Error transferring funds:", error);
      const errorDetail = error.response?.data?.detail;
      return {
        success: false,
        data: null,
        error: errorDetail?.error || error.message || "Failed to transfer funds",
        message: errorDetail?.message || "An error occurred while transferring funds",
      };
    }
  }

  /**
   * Format balance for display
   */
  formatBalance(balance) {
    if (!balance && balance !== 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(balance);
  }
}

export default new WalletService();
