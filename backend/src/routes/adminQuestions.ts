import express from "express";
import { pool } from "../config/database";

const router = express.Router();

// Edit a question
router.put("/questions/:id", async (req, res) => {
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    difficulty,
    is_active,
  } = req.body;
  await pool.execute(
    "UPDATE questions SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, difficulty=?, is_active=? WHERE id=?",
    [
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      is_active,
      req.params.id,
    ]
  );
  res.json({ message: "Question updated" });
});

// Add a question
router.post("/questions", async (req, res) => {
  const {
    skill_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    difficulty,
    is_active,
  } = req.body;
  await pool.execute(
    "INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      skill_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      is_active,
    ]
  );
  res.json({ message: "Question added" });
});

// Delete a question
router.delete("/questions/:id", async (req, res) => {
  await pool.execute("DELETE FROM questions WHERE id=?", [req.params.id]);
  res.json({ message: "Question deleted" });
});

export default router;
