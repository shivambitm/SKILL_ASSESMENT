// Node.js script to seed Project Management questions into SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../skill_assessment.db");
const db = new sqlite3.Database(dbPath);

const questions = [
  [
    5,
    "Which methodology uses sprints and daily standups?",
    "Waterfall",
    "Agile",
    "Kanban",
    "Six Sigma",
    "B",
    1,
  ],
  [
    5,
    "What is a Gantt chart used for?",
    "Tracking project costs",
    "Scheduling tasks",
    "Managing risks",
    "Quality control",
    "B",
    1,
  ],
  [
    5,
    "Who is responsible for removing impediments in Scrum?",
    "Product Owner",
    "Scrum Master",
    "Team Lead",
    "Stakeholder",
    "B",
    1,
  ],
  [
    5,
    "Which document defines project scope, goals, and deliverables?",
    "Project Charter",
    "Risk Register",
    "Change Log",
    "Issue Tracker",
    "A",
    1,
  ],
  [
    5,
    "What does WBS stand for in project management?",
    "Work Breakdown Structure",
    "Workflow Business System",
    "Weekly Budget Summary",
    "Work Benefit Statement",
    "A",
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
    console.log("Project Management questions seeded successfully.");
    db.close();
  });
});
