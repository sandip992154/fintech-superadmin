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
   * Top up wallet with amount
   */
  async topupWallet(userId, amount) {
    try {
      const response = await apiClient.post(`/transactions/wallet/topup/${userId}`, {
        amount: parseFloat(amount),
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
