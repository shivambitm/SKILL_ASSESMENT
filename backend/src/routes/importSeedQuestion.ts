import express from "express";
import { pool } from "../config/database";

const router = express.Router();

// Import a seed-only question into the DB
router.post("/admin/import-seed-question", async (req, res) => {
  try {
    const {
      skill_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      is_active,
      difficulty,
    } = req.body;
    await pool.execute(
      `INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        is_active ?? 1,
        difficulty ?? "easy",
      ]
    );
    res.json({ success: true, message: "Question imported to DB" });
  } catch (err) {
    console.error("Error importing seed question:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to import question" });
  }
});

export default router;
