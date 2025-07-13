"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedData = async () => {
    try {
        console.log("Starting database seeding...");
        // Connect to database first
        await (0, database_1.connectDB)();
        // Create admin user
        const adminPassword = await bcryptjs_1.default.hash("admin123", 12);
        await database_1.pool.execute("INSERT OR IGNORE INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)", ["admin@example.com", adminPassword, "System", "Admin", "admin"]);
        // Create sample regular user
        const userPassword = await bcryptjs_1.default.hash("user123", 12);
        await database_1.pool.execute("INSERT OR IGNORE INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)", ["user@example.com", userPassword, "John", "Doe", "user"]);
        // Create sample skills
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
        for (const skill of skills) {
            await database_1.pool.execute("INSERT OR IGNORE INTO skills (name, description, category) VALUES (?, ?, ?)", [skill.name, skill.description, skill.category]);
        }
        // Get skill IDs for creating questions
        const [skillRows] = await database_1.pool.execute("SELECT id, name FROM skills");
        const skillMap = new Map();
        skillRows.forEach((skill) => {
            skillMap.set(skill.name, skill.id);
        });
        // Create sample questions for JavaScript
        const jsQuestions = [
            {
                question: "What is the correct way to declare a variable in JavaScript?",
                options: [
                    "var x = 5;",
                    "variable x = 5;",
                    "v x = 5;",
                    "declare x = 5;",
                ],
                correct: "A",
                difficulty: "easy",
            },
            {
                question: "Which method is used to add an element to the end of an array?",
                options: ["push()", "pop()", "shift()", "unshift()"],
                correct: "A",
                difficulty: "easy",
            },
            {
                question: 'What does "hoisting" mean in JavaScript?',
                options: [
                    "Moving variables to the top of their scope",
                    "Lifting heavy objects",
                    "Creating new functions",
                    "Deleting variables",
                ],
                correct: "A",
                difficulty: "medium",
            },
            {
                question: "What is a closure in JavaScript?",
                options: [
                    "A function that has access to variables in its outer scope",
                    "A way to close files",
                    "A loop construct",
                    "A conditional statement",
                ],
                correct: "A",
                difficulty: "hard",
            },
            {
                question: "Which operator is used for strict equality in JavaScript?",
                options: ["==", "===", "=", "!="],
                correct: "B",
                difficulty: "easy",
            },
        ];
        if (skillMap.has("JavaScript")) {
            for (const question of jsQuestions) {
                await database_1.pool.execute("INSERT OR IGNORE INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    skillMap.get("JavaScript"),
                    question.question,
                    question.options[0],
                    question.options[1],
                    question.options[2],
                    question.options[3],
                    question.correct,
                    question.difficulty,
                ]);
            }
        }
        // Create sample questions for React
        const reactQuestions = [
            {
                question: "What is JSX?",
                options: [
                    "JavaScript XML",
                    "Java Syntax Extension",
                    "JSON XML",
                    "JavaScript Extension",
                ],
                correct: "A",
                difficulty: "easy",
            },
            {
                question: "What hook is used to manage state in functional components?",
                options: ["useEffect", "useState", "useContext", "useReducer"],
                correct: "B",
                difficulty: "easy",
            },
            {
                question: "What is the purpose of useEffect hook?",
                options: [
                    "To manage state",
                    "To handle side effects",
                    "To create refs",
                    "To optimize performance",
                ],
                correct: "B",
                difficulty: "medium",
            },
            {
                question: "What is the virtual DOM?",
                options: [
                    "A copy of the real DOM kept in memory",
                    "A new web standard",
                    "A JavaScript library",
                    "A database",
                ],
                correct: "A",
                difficulty: "medium",
            },
            {
                question: "What is prop drilling?",
                options: [
                    "Passing props through multiple component levels",
                    "Creating new props",
                    "Validating props",
                    "Deleting props",
                ],
                correct: "A",
                difficulty: "hard",
            },
        ];
        if (skillMap.has("React")) {
            for (const question of reactQuestions) {
                await database_1.pool.execute("INSERT OR IGNORE INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    skillMap.get("React"),
                    question.question,
                    question.options[0],
                    question.options[1],
                    question.options[2],
                    question.options[3],
                    question.correct,
                    question.difficulty,
                ]);
            }
        }
        // Create sample questions for Node.js
        const nodeQuestions = [
            {
                question: "What is Node.js?",
                options: [
                    "A JavaScript runtime",
                    "A database",
                    "A web browser",
                    "A programming language",
                ],
                correct: "A",
                difficulty: "easy",
            },
            {
                question: "Which module is used to create a web server in Node.js?",
                options: ["fs", "http", "path", "url"],
                correct: "B",
                difficulty: "easy",
            },
            {
                question: "What is npm?",
                options: [
                    "Node Package Manager",
                    "New Programming Method",
                    "Network Protocol Manager",
                    "Node Process Manager",
                ],
                correct: "A",
                difficulty: "easy",
            },
            {
                question: "What is middleware in Express.js?",
                options: [
                    "Functions that execute during the request-response cycle",
                    "Database connections",
                    "File systems",
                    "Network protocols",
                ],
                correct: "A",
                difficulty: "medium",
            },
            {
                question: "What is the event loop in Node.js?",
                options: [
                    "A mechanism that handles asynchronous operations",
                    "A type of database",
                    "A web framework",
                    "A testing tool",
                ],
                correct: "A",
                difficulty: "hard",
            },
        ];
        if (skillMap.has("Node.js")) {
            for (const question of nodeQuestions) {
                await database_1.pool.execute("INSERT OR IGNORE INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    skillMap.get("Node.js"),
                    question.question,
                    question.options[0],
                    question.options[1],
                    question.options[2],
                    question.options[3],
                    question.correct,
                    question.difficulty,
                ]);
            }
        }
        // Create sample questions for Python
        const pythonQuestions = [
            {
                question: "What is the output of print(2+2)?",
                options: ["2", "4", "22", "Error"],
                correct: "B",
                difficulty: "easy",
            },
        ];
        if (skillMap.has("Python")) {
            for (const question of pythonQuestions) {
                await database_1.pool.execute("INSERT OR IGNORE INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    skillMap.get("Python"),
                    question.question,
                    question.options[0],
                    question.options[1],
                    question.options[2],
                    question.options[3],
                    question.correct,
                    question.difficulty,
                ]);
            }
        }
        console.log("Database seeding completed successfully!");
        console.log("Default admin credentials:");
        console.log("Email: admin@example.com");
        console.log("Password: admin123");
        console.log("");
        console.log("Default user credentials:");
        console.log("Email: user@example.com");
        console.log("Password: user123");
    }
    catch (error) {
        console.error("Error seeding database:", error);
    }
};
seedData();
//# sourceMappingURL=seed.js.map