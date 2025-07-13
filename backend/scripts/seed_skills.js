// Node.js script to seed skills into SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../skill_assessment.db");
const db = new sqlite3.Database(dbPath);

const skills = [
  [
    5,
    "Project Management",
    "Project management methodologies, tools, and best practices.",
  ],
  [6, "JavaScript", "JavaScript language fundamentals and advanced topics."],
  [7, "SQL", "Database design, queries, and optimization."],
];

db.serialize(() => {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO skills (id, name, description) VALUES (?, ?, ?)`
  );
  skills.forEach((s) =>
    stmt.run(s, (err) => {
      if (err) {
        console.error("Error inserting skill:", err.message);
      }
    })
  );
  stmt.finalize(() => {
    console.log("Skills seeded successfully.");
    db.close();
  });
});
