// Debug script to test the quiz API
const BASE_URL = "http://localhost:3001/api";

async function testQuizAPI() {
  console.log("Testing Quiz API...");

  try {
    // Test 1: Get skills
    console.log("\n1. Testing skills endpoint...");
    const skillsResponse = await fetch(
      `${BASE_URL}/skills?limit=10&isActive=true`
    );
    console.log("Skills response status:", skillsResponse.status);

    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json();
      console.log("Skills data:", skillsData);

      if (
        skillsData.data &&
        skillsData.data.skills &&
        skillsData.data.skills.length > 0
      ) {
        const skillId = skillsData.data.skills[0].id;
        console.log(`\n2. Testing questions for skill ${skillId}...`);

        // Test 2: Get questions for the first skill
        const questionsResponse = await fetch(
          `${BASE_URL}/questions/quiz?skillId=${skillId}&limit=10`
        );
        console.log("Questions response status:", questionsResponse.status);

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          console.log("Questions data:", questionsData);
        } else {
          console.log("Questions error:", await questionsResponse.text());
        }
      }
    } else {
      console.log("Skills error:", await skillsResponse.text());
    }
  } catch (error) {
    console.error("Network error:", error);
    console.log(
      "Make sure the backend server is running on http://localhost:3001"
    );
  }
}

// Run the test
testQuizAPI();
