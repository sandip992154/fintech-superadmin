/**
 * Test Script for Member Management Service
 * Tests schemes fetching and other API endpoints
 */
import memberService from "./src/services/memberManagementService.js";

// Test schemes fetching
async function testSchemes() {
  console.log("🧪 Testing schemes API...");

  try {
    const schemes = await memberService.getSchemes(false); // Don't use cache
    console.log("✅ Schemes fetched successfully:", {
      count: schemes?.length || 0,
      structure: typeof schemes,
      firstScheme: schemes?.[0] || "No schemes found",
      response: schemes,
    });

    return schemes;
  } catch (error) {
    console.error("❌ Error fetching schemes:", error);
    return null;
  }
}

// Test member management service initialization
async function testService() {
  console.log("🧪 Testing member service...");

  try {
    // Test user access level
    const accessLevel = memberService.getUserAccessLevel("SuperAdmin");
    console.log("✅ Access level test:", accessLevel);

    // Test parameter building
    const params = memberService.buildOptimizedParams(
      { page: 1, limit: 20 },
      "SuperAdmin",
      "list"
    );
    console.log("✅ Parameter building test:", params);

    return true;
  } catch (error) {
    console.error("❌ Service test error:", error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting member management service tests...\n");

  const serviceTest = await testService();
  const schemesTest = await testSchemes();

  console.log("\n📊 Test Results:");
  console.log("- Service initialization:", serviceTest ? "✅ PASS" : "❌ FAIL");
  console.log("- Schemes API:", schemesTest ? "✅ PASS" : "❌ FAIL");

  if (serviceTest && schemesTest) {
    console.log("\n🎉 All tests passed! Member system is working correctly.");
  } else {
    console.log("\n⚠️ Some tests failed. Check the logs above for details.");
  }
}

// Export for potential use
export { testSchemes, testService, runTests };

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  runTests();
}
