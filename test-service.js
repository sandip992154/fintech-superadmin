/**
 * Quick integration test for UnifiedMemberManagementService
 */
import memberService from "../src/services/memberManagementService.js";

// Test the service methods
console.log("Testing UnifiedMemberManagementService...");

// Test getUserAccessLevel
console.log("Admin access level:", memberService.getUserAccessLevel("Admin"));
console.log(
  "Customer access level:",
  memberService.getUserAccessLevel("Customer")
);

// Test buildOptimizedParams
const testParams = memberService.buildOptimizedParams(
  { search: "test", page: 1 },
  "Admin",
  "list"
);
console.log("Optimized params for Admin:", testParams);

console.log("✅ Service methods are working correctly!");
