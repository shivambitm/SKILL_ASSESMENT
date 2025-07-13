// Rate Limit Test Script
// This script will test rate limiting behavior in different environments

// Test parameters
const API_URL = "http://localhost:5002";
const AUTH_ENDPOINT = "/api/auth/login";
const GENERAL_ENDPOINT = "/api/skills";
const TEST_CREDENTIALS = { email: "test@example.com", password: "password" };

// Run a series of rapid requests to trigger rate limiting
async function testRateLimiting() {
  console.log("🔍 RATE LIMIT TESTING SCRIPT");
  console.log("============================");
  console.log(`API URL: ${API_URL}`);

  // First check the current environment
  try {
    const response = await fetch(`${API_URL}/health-diagnostic`);
    const data = await response.json();
    console.log("📊 Environment Info:");
    console.log(`- Environment: ${data.config.environment}`);
    console.log(`- isDevelopment: ${data.config.isDevelopment}`);
    console.log(`- Rate limit window: ${data.config.rateLimit.windowMs}ms`);
    console.log(`- Max requests: ${data.config.rateLimit.maxRequests}`);
    console.log(
      `- Max auth requests: ${data.config.rateLimit.authMaxRequests}`
    );
    console.log("============================");
  } catch (error) {
    console.error("Failed to get environment info:", error);
  }

  // Test OPTIONS requests (should never be rate limited)
  console.log("🔄 Testing OPTIONS requests (should never be rate limited)");
  let optionsFailures = 0;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${API_URL}${AUTH_ENDPOINT}`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5173",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      if (response.status !== 204) {
        console.error(
          `❌ OPTIONS request ${i + 1} failed with status ${response.status}`
        );
        optionsFailures++;
      }
    } catch (error) {
      console.error(`❌ OPTIONS request ${i + 1} failed:`, error);
      optionsFailures++;
    }
  }

  console.log(
    `✅ OPTIONS test completed with ${optionsFailures} failures out of 30 requests`
  );
  console.log("============================");

  // Test auth endpoint rate limiting
  console.log("🔄 Testing auth endpoint rate limiting");
  let authFailures = 0;
  let firstRateLimitReached = false;

  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${API_URL}${AUTH_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(TEST_CREDENTIALS),
      });

      if (response.status === 429) {
        if (!firstRateLimitReached) {
          firstRateLimitReached = true;
          console.log(
            `⚠️ Rate limit reached after ${i + 1} requests to auth endpoint`
          );

          // Check for Retry-After header
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            console.log(`⏱️ Retry-After: ${retryAfter} seconds`);
          }

          const data = await response.json();
          console.log(`📝 Error message: ${data.message}`);
        }
        authFailures++;
      }
    } catch (error) {
      console.error(`❌ Auth request ${i + 1} failed:`, error);
      authFailures++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(
    `✅ Auth test completed with ${authFailures} rate-limited requests out of 30`
  );
  console.log("============================");

  // Test general endpoint rate limiting
  console.log("🔄 Testing general endpoint rate limiting");
  let generalFailures = 0;
  firstRateLimitReached = false;

  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`${API_URL}${GENERAL_ENDPOINT}`);

      if (response.status === 429) {
        if (!firstRateLimitReached) {
          firstRateLimitReached = true;
          console.log(
            `⚠️ Rate limit reached after ${i + 1} requests to general endpoint`
          );

          // Check for Retry-After header
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            console.log(`⏱️ Retry-After: ${retryAfter} seconds`);
          }

          const data = await response.json();
          console.log(`📝 Error message: ${data.message}`);
        }
        generalFailures++;
      }
    } catch (error) {
      console.error(`❌ General request ${i + 1} failed:`, error);
      generalFailures++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(
    `✅ General test completed with ${generalFailures} rate-limited requests out of 50`
  );
  console.log("============================");

  // Summary
  console.log("📋 TEST SUMMARY:");
  console.log(
    `- OPTIONS requests: ${
      optionsFailures === 0 ? "✅ ALL PASSED" : `❌ ${optionsFailures} FAILED`
    }`
  );
  console.log(
    `- Auth endpoint: ${
      authFailures === 0
        ? "✅ NO RATE LIMITING"
        : `⚠️ ${authFailures} RATE LIMITED`
    }`
  );
  console.log(
    `- General endpoint: ${
      generalFailures === 0
        ? "✅ NO RATE LIMITING"
        : `⚠️ ${generalFailures} RATE LIMITED`
    }`
  );

  if (optionsFailures === 0 && authFailures === 0 && generalFailures === 0) {
    console.log(
      "🎉 All tests passed! Rate limiting is properly disabled in development mode."
    );
  } else if (optionsFailures === 0) {
    console.log(
      "⚠️ OPTIONS requests are properly handled, but rate limiting is active."
    );
    console.log(
      "   Check if NODE_ENV=development is properly set in your .env file."
    );
  } else {
    console.log(
      "❌ OPTIONS requests are being rate limited. This should never happen!"
    );
    console.log(
      "   Check your CORS and rate limiting middleware configuration."
    );
  }
}

// Run the tests
testRateLimiting().catch((error) => {
  console.error("Test script error:", error);
});
