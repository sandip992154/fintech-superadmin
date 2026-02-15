import axios from "axios";

/**
 * Wallet API Test Suite
 * Tests all wallet endpoints
 * 
 * Usage: 
 * 1. Import this file in any test runner
 * 2. Call runWalletTests() with a valid JWT token
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance with token
const createClient = (token) => {
  return axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

// Test Results Logger
const log = {
  success: (message) => console.log("✅", message),
  error: (message) => console.error("❌", message),
  info: (message) => console.log("ℹ️", message),
  warn: (message) => console.warn("⚠️", message),
};

/**
 * Test 1: Create Wallet
 */
async function testCreateWallet(client, userId) {
  try {
    log.info("Testing: POST /transactions/wallet/create");
    const response = await client.post("/transactions/wallet/create", {
      user_id: userId,
    });

    if (response.data.success) {
      log.success("Wallet created successfully");
      log.info(`Wallet ID: ${response.data.data.id}`);
      log.info(`Balance: ₹${response.data.data.balance}`);
      return response.data.data;
    } else {
      log.error("Create wallet failed");
      log.warn(response.data.detail);
      return null;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.warn("Wallet already exists (expected)");
      return null;
    }
    log.error(`Create wallet error: ${error.message}`);
    return null;
  }
}

/**
 * Test 2: Get Wallet Balance
 */
async function testGetWalletBalance(client, userId) {
  try {
    log.info("Testing: GET /transactions/wallet/{user_id}");
    const response = await client.get(`/transactions/wallet/${userId}`);

    log.success("Wallet balance fetched");
    log.info(`User ID: ${response.data.user_id}`);
    log.info(`Balance: ₹${response.data.balance}`);
    log.info(`Last Updated: ${response.data.last_updated}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      log.warn("Wallet not found (need to create first)");
    } else {
      log.error(`Get wallet balance error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Test 3: Load Wallet (Topup)
 */
async function testLoadWallet(client, userId, amount = 1000, remark = "Test load") {
  try {
    log.info("Testing: POST /transactions/wallet/topup/{user_id}");
    log.info(`Loading: ₹${amount} with remark: "${remark}"`);

    const response = await client.post(`/transactions/wallet/topup/${userId}`, {
      amount,
      remark,
    });

    if (response.data.success) {
      log.success(`Wallet loaded successfully`);
      log.info(`New Balance: ₹${response.data.data.balance}`);
      log.info(`Transaction ID: ${response.data.data.transaction_id}`);
      log.info(`Amount Added: ₹${response.data.data.amount_added}`);
      return response.data.data;
    } else {
      log.error("Load wallet failed");
      log.warn(response.data.detail);
      return null;
    }
  } catch (error) {
    log.error(`Load wallet error: ${error.message}`);
    if (error.response?.data?.detail) {
      log.warn(`Details: ${error.response.data.detail}`);
    }
    return null;
  }
}

/**
 * Test 4: Get Wallet Transactions
 */
async function testGetTransactions(
  client,
  userId,
  limit = 10,
  offset = 0
) {
  try {
    log.info(
      "Testing: GET /transactions/wallet/{user_id}/transactions?limit={limit}&offset={offset}"
    );
    const response = await client.get(
      `/transactions/wallet/${userId}/transactions`,
      {
        params: { limit, offset },
      }
    );

    if (response.data.success) {
      log.success("Transactions fetched");
      log.info(
        `Total Transactions: ${response.data.data.total_count}`
      );
      log.info(
        `Current Page: ${response.data.data.transactions.length} of ${response.data.data.total_count}`
      );

      // Display transaction details
      if (
        response.data.data.transactions &&
        response.data.data.transactions.length > 0
      ) {
        log.info("Recent Transactions:");
        response.data.data.transactions.slice(0, 3).forEach((txn, idx) => {
          log.info(
            `  ${idx + 1}. ${txn.type === "credit" ? "+" : "-"}₹${txn.amount} on ${new Date(
              txn.created_at
            ).toLocaleString()} (Ref: ${txn.reference_id})`
          );
          if (txn.remark) {
            log.info(`     Remark: ${txn.remark}`);
          }
        });
      }

      return response.data.data;
    } else {
      log.error("Get transactions failed");
      return null;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.warn("Wallet not found");
    } else {
      log.error(`Get transactions error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Run All Tests
 */
export async function runWalletTests(token, userId) {
  if (!token) {
    log.error("Token not provided");
    return false;
  }

  if (!userId) {
    log.error("User ID not provided");
    return false;
  }

  const client = createClient(token);

  log.info("=== Starting Wallet API Tests ===");
  log.info(`Base URL: ${API_BASE_URL}`);
  log.info(`User ID: ${userId}`);

  console.log("\n");

  // Test 1: Try to create wallet (may fail if already exists)
  log.info("Test 1: Create Wallet");
  await testCreateWallet(client, userId);

  console.log("\n");

  // Test 2: Get wallet balance
  log.info("Test 2: Get Wallet Balance");
  const wallet = await testGetWalletBalance(client, userId);

  console.log("\n");

  // Test 3: Load wallet
  log.info("Test 3: Load Wallet");
  const beforeBalance = wallet?.balance || 0;
  await testLoadWallet(client, userId, 1000, "API test load");

  console.log("\n");

  // Test 4: Get updated balance
  log.info("Test 4: Get Updated Wallet Balance");
  const updatedWallet = await testGetWalletBalance(client, userId);
  if (updatedWallet) {
    log.info(
      `Balance increased by: ₹${updatedWallet.balance - beforeBalance}`
    );
  }

  console.log("\n");

  // Test 5: Get transaction history
  log.info("Test 5: Get Transaction History");
  await testGetTransactions(client, userId);

  console.log("\n");

  log.success("=== All Tests Completed ===");
  return true;
}

/**
 * Individual Test Exports (for selective testing)
 */
export { testCreateWallet, testGetWalletBalance, testLoadWallet, testGetTransactions };

/**
 * Usage Example in Component:
 * 
 * import { runWalletTests } from '@/services/walletTest';
 * 
 * const handleTestWallet = async () => {
 *   const token = localStorage.getItem('token');
 *   const userId = 123; // Get from user context
 *   await runWalletTests(token, userId);
 * };
 */
