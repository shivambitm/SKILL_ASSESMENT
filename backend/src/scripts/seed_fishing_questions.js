// Node.js script to seed Fishing questions into SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../skill_assessment.db");
const db = new sqlite3.Database(dbPath);

const questions = [
  [
    20,
    "Do you keep fish bowl in home ?",
    "No",
    "Yes",
    "I love it ",
    "Null",
    "C",
    1,
  ],
  [
    20,
    "What is your hr name ?",
    "Deepika",
    "Ashish",
    "Kamlesh",
    "Priya",
    "A",
    1,
  ]
];

db.serialize(() => {
  const stmt = db.prepare(
    `INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  questions.forEach((q) =>
    stmt.run(q, (err) => {
      if (err) {
        console.error("Error inserting question:", err.message);
      }
    })
  );
  stmt.finalize(() => {
    console.log("Fishing questions seeded successfully.");
    db.close();
  });
});
