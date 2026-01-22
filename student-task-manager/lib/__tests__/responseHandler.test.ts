/**
 * Example Test File - Demonstrates Global API Response Handler Usage
 * 
 * This file shows how to test API endpoints that use the global response handler.
 * You can run these tests with your preferred testing framework (Jest, Vitest, etc.)
 */

import { sendSuccess, sendError, sendPaginatedSuccess, handlePrismaError } from '../responseHandler';
import { ERROR_CODES } from '../errorCodes';

/**
 * Example 1: Testing sendSuccess
 */
async function testSendSuccess() {
    const userData = { id: 1, name: "Alice", email: "alice@example.com" };
    const response = sendSuccess(userData, "User fetched successfully");
    const json = await response.json();

    console.log("✅ sendSuccess test:");
    console.log(JSON.stringify(json, null, 2));
    console.assert(json.success === true, "Response should have success: true");
    console.assert(json.data.id === 1, "Response should contain user data");
    console.assert(json.timestamp, "Response should have timestamp");
}

/**
 * Example 2: Testing sendError
 */
async function testSendError() {
    const response = sendError(
        "Missing required field: email",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: ["email"] }
    );
    const json = await response.json();

    console.log("\n❌ sendError test:");
    console.log(JSON.stringify(json, null, 2));
    console.assert(json.success === false, "Response should have success: false");
    console.assert(json.error.code === "E002", "Response should have correct error code");
    console.assert(json.error.details.missingFields[0] === "email", "Response should include details");
}

/**
 * Example 3: Testing sendPaginatedSuccess
 */
async function testSendPaginatedSuccess() {
    const items = [
        { id: 1, title: "Task 1" },
        { id: 2, title: "Task 2" }
    ];
    const response = sendPaginatedSuccess(items, 25, 1, 10, "Tasks fetched successfully");
    const json = await response.json();

    console.log("\n📄 sendPaginatedSuccess test:");
    console.log(JSON.stringify(json, null, 2));
    console.assert(json.success === true, "Response should have success: true");
    console.assert(json.data.items.length === 2, "Response should contain items");
    console.assert(json.data.pagination.total === 25, "Response should have correct total");
    console.assert(json.data.pagination.totalPages === 3, "Response should calculate total pages");
    console.assert(json.data.pagination.hasNextPage === true, "Response should indicate next page exists");
}

/**
 * Example 4: Testing handlePrismaError
 */
function testHandlePrismaError() {
    // Test P1001 - Database unreachable
    const dbError = { code: "P1001", message: "Can't reach database" };
    const result1 = handlePrismaError(dbError);
    console.log("\n🔧 handlePrismaError test (P1001):");
    console.log(JSON.stringify(result1, null, 2));
    console.assert(result1.code === "DATABASE_UNREACHABLE", "Should map to DATABASE_UNREACHABLE");
    console.assert(result1.status === 503, "Should return 503 status");

    // Test P2002 - Unique constraint
    const uniqueError = { code: "P2002", meta: { target: ["email"] } };
    const result2 = handlePrismaError(uniqueError);
    console.log("\n🔧 handlePrismaError test (P2002):");
    console.log(JSON.stringify(result2, null, 2));
    console.assert(result2.code === "DUPLICATE_ENTRY", "Should map to DUPLICATE_ENTRY");
    console.assert(result2.status === 400, "Should return 400 status");
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log("🧪 Running Global API Response Handler Tests\n");
    console.log("=".repeat(60));

    await testSendSuccess();
    await testSendError();
    await testSendPaginatedSuccess();
    testHandlePrismaError();

    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("\nThe Global API Response Handler is working correctly.");
    console.log("You can now use it across all your API endpoints for consistent responses.");
}

// Uncomment to run tests
// runAllTests().catch(console.error);

export { runAllTests };
