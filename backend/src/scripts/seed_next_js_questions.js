// Node.js script to seed NEXT JS questions into SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../skill_assessment.db");
const db = new sqlite3.Database(dbPath);

const questions = [
  [
    9,
    "is next react framework ?",
    "yes",
    "no",
    "maybe",
    "null",
    "A",
    1,
  ],
  [
    9,
    "what is react framework ?\n",
    "next js",
    "react",
    "node js",
    "mongo db",
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
    console.log("NEXT JS questions seeded successfully.");
    db.close();
  });
});
