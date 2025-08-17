import { connectDB } from "../src/config/database";
import { User, Skill, Question } from "../src/models";
import bcrypt from "bcryptjs";

const seedData = async () => {
  try {
    console.log("Starting MongoDB database seeding...");

    // Connect to database first
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("Clearing existing data...");
    // Only clear if no users exist (first time setup)
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      console.log("First time setup - creating initial data");
    } else {
      console.log(`Found ${existingUsers} existing users - only adding missing skills/questions`);
      // Don't clear users, only clear skills and questions for fresh data
      await Skill.deleteMany({});
      await Question.deleteMany({});
    }

    // Create admin user only if no users exist
    if (existingUsers === 0) {
      console.log("Creating admin user...");
      const adminPassword = await bcrypt.hash("admin123", 12);
      const adminUser = new User({
        email: "admin@example.com",
        password: adminPassword,
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        isActive: true
      });
      await adminUser.save();

      // Create sample regular user
      console.log("Creating sample user...");
      const userPassword = await bcrypt.hash("user123", 12);
      const regularUser = new User({
        email: "user@example.com",
        password: userPassword,
        firstName: "John",
        lastName: "Doe",
        role: "user",
        isActive: true
      });
      await regularUser.save();
    } else {
      console.log("Users already exist - skipping user creation");
    }

    // Create sample skills
    console.log("Creating skills...");
    const skills = [
      {
        name: "JavaScript",
        description: "JavaScript programming language fundamentals",
        category: "Programming",
      },
      {
        name: "React",
        description: "React.js library for building user interfaces",
        category: "Frontend",
      },
      {
        name: "Node.js",
        description: "Server-side JavaScript runtime environment",
        category: "Backend",
      },
      {
        name: "Database Design",
        description: "Database design principles and best practices",
        category: "Database",
      },
      {
        name: "Project Management",
        description: "Project management methodologies and tools",
        category: "Management",
      },
      {
        name: "Python",
        description: "Python programming language basics",
        category: "Programming",
      },
    ];

    const createdSkills = [];
    for (const skillData of skills) {
      const skill = new Skill(skillData);
      const savedSkill = await skill.save();
      createdSkills.push(savedSkill);
      console.log(`Created skill: ${skillData.name}`);
    }

    // Create sample questions for JavaScript
    console.log("Creating JavaScript questions...");
    const jsSkill = createdSkills.find(s => s.name === "JavaScript");
    if (jsSkill) {
      const jsQuestions = [
        {
          skill_id: jsSkill._id,
          question_text: "What is the correct way to declare a variable in JavaScript?",
          option_a: "var x = 5;",
          option_b: "variable x = 5;",
          option_c: "v x = 5;",
          option_d: "declare x = 5;",
          correct_answer: "A",
          difficulty: "easy",
        },
        {
          skill_id: jsSkill._id,
          question_text: "Which method is used to add an element to the end of an array?",
          option_a: "push()",
          option_b: "pop()",
          option_c: "shift()",
          option_d: "unshift()",
          correct_answer: "A",
          difficulty: "easy",
        },
        {
          skill_id: jsSkill._id,
          question_text: 'What does "hoisting" mean in JavaScript?',
          option_a: "Moving variables to the top of their scope",
          option_b: "Lifting heavy objects",
          option_c: "Creating new functions",
          option_d: "Deleting variables",
          correct_answer: "A",
          difficulty: "medium",
        },
        {
          skill_id: jsSkill._id,
          question_text: "What is a closure in JavaScript?",
          option_a: "A function that has access to variables in its outer scope",
          option_b: "A way to close files",
          option_c: "A loop construct",
          option_d: "A conditional statement",
          correct_answer: "A",
          difficulty: "hard",
        },
        {
          skill_id: jsSkill._id,
          question_text: "Which operator is used for strict equality in JavaScript?",
          option_a: "==",
          option_b: "===",
          option_c: "=",
          option_d: "!=",
          correct_answer: "B",
          difficulty: "easy",
        },
      ];

      for (const questionData of jsQuestions) {
        const question = new Question(questionData);
        await question.save();
      }
      console.log(`Created ${jsQuestions.length} JavaScript questions`);
    }

    // Create sample questions for React
    console.log("Creating React questions...");
    const reactSkill = createdSkills.find(s => s.name === "React");
    if (reactSkill) {
      const reactQuestions = [
        {
          skill_id: reactSkill._id,
          question_text: "What is JSX?",
          option_a: "JavaScript XML",
          option_b: "Java Syntax Extension",
          option_c: "JSON XML",
          option_d: "JavaScript Extension",
          correct_answer: "A",
          difficulty: "easy",
        },
        {
          skill_id: reactSkill._id,
          question_text: "What hook is used to manage state in functional components?",
          option_a: "useEffect",
          option_b: "useState",
          option_c: "useContext",
          option_d: "useReducer",
          correct_answer: "B",
          difficulty: "easy",
        },
        {
          skill_id: reactSkill._id,
          question_text: "What is the purpose of useEffect hook?",
          option_a: "To manage state",
          option_b: "To handle side effects",
          option_c: "To create refs",
          option_d: "To optimize performance",
          correct_answer: "B",
          difficulty: "medium",
        },
        {
          skill_id: reactSkill._id,
          question_text: "What is the virtual DOM?",
          option_a: "A copy of the real DOM kept in memory",
          option_b: "A new web standard",
          option_c: "A JavaScript library",
          option_d: "A database",
          correct_answer: "A",
          difficulty: "medium",
        },
        {
          skill_id: reactSkill._id,
          question_text: "What is prop drilling?",
          option_a: "Passing props through multiple component levels",
          option_b: "Creating new props",
          option_c: "Validating props",
          option_d: "Deleting props",
          correct_answer: "A",
          difficulty: "hard",
        },
      ];

      for (const questionData of reactQuestions) {
        const question = new Question(questionData);
        await question.save();
      }
      console.log(`Created ${reactQuestions.length} React questions`);
    }

    // Create sample questions for Node.js
    console.log("Creating Node.js questions...");
    const nodeSkill = createdSkills.find(s => s.name === "Node.js");
    if (nodeSkill) {
      const nodeQuestions = [
        {
          skill_id: nodeSkill._id,
          question_text: "What is Node.js?",
          option_a: "A JavaScript runtime",
          option_b: "A database",
          option_c: "A web browser",
          option_d: "A programming language",
          correct_answer: "A",
          difficulty: "easy",
        },
        {
          skill_id: nodeSkill._id,
          question_text: "Which module is used to create a web server in Node.js?",
          option_a: "fs",
          option_b: "http",
          option_c: "path",
          option_d: "url",
          correct_answer: "B",
          difficulty: "easy",
        },
        {
          skill_id: nodeSkill._id,
          question_text: "What is npm?",
          option_a: "Node Package Manager",
          option_b: "New Programming Method",
          option_c: "Network Protocol Manager",
          option_d: "Node Process Manager",
          correct_answer: "A",
          difficulty: "easy",
        },
        {
          skill_id: nodeSkill._id,
          question_text: "What is middleware in Express.js?",
          option_a: "Functions that execute during the request-response cycle",
          option_b: "Database connections",
          option_c: "File systems",
          option_d: "Network protocols",
          correct_answer: "A",
          difficulty: "medium",
        },
        {
          skill_id: nodeSkill._id,
          question_text: "What is the event loop in Node.js?",
          option_a: "A mechanism that handles asynchronous operations",
          option_b: "A type of database",
          option_c: "A web framework",
          option_d: "A testing tool",
          correct_answer: "A",
          difficulty: "hard",
        },
      ];

      for (const questionData of nodeQuestions) {
        const question = new Question(questionData);
        await question.save();
      }
      console.log(`Created ${nodeQuestions.length} Node.js questions`);
    }

    console.log("\n✅ MongoDB database seeding completed successfully!");
    console.log("\n🔑 Default admin credentials:");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    console.log("\n👤 Default user credentials:");
    console.log("Email: user@example.com");
    console.log("Password: user123");
    
    console.log("\n📊 Summary:");
    console.log(`- Created ${createdSkills.length} skills`);
    console.log(`- Created questions for JavaScript, React, and Node.js`);
    console.log(`- Created 2 users (1 admin, 1 regular user)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedData();