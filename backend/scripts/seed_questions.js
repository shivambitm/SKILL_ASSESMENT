// Node.js script to seed Database Design questions into SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../skill_assessment.db");
const db = new sqlite3.Database(dbPath);

const questions = [
  [
    4,
    "Which SQL statement is used to create a table?",
    "CREATE TABLE",
    "INSERT INTO",
    "ALTER TABLE",
    "DROP TABLE",
    "A",
    1,
  ],
  [
    4,
    "What is a primary key?",
    "A unique identifier for a record",
    "A type of SQL index",
    "A foreign key",
    "A table constraint",
    "A",
    1,
  ],
  [
    4,
    "Which command is used to remove all records from a table but not the table itself?",
    "DROP",
    "DELETE",
    "TRUNCATE",
    "REMOVE",
    "C",
    1,
  ],
  [
    4,
    "What does the acronym ERD stand for?",
    "Entity Relationship Diagram",
    "Entity Relational Data",
    "External Reference Data",
    "Entity Referential Diagram",
    "A",
    1,
  ],
  [
    4,
    "Which SQL clause is used to filter the results of a query?",
    "ORDER BY",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "B",
    1,
  ],
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
    console.log("Database Design questions seeded successfully.");
    db.close();
  });
});
