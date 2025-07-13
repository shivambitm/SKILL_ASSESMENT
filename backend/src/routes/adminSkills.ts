import express from "express";
import { pool } from "../config/database";

const router = express.Router();

// GET all skills with their questions (from DB)
router.get(
  "/skills-with-questions",
  /*isAdmin,*/ async (req, res) => {
    try {
      const [skills] = await pool.execute("SELECT * FROM skills");
      for (const skill of skills as any[]) {
        const [questions] = await pool.execute(
          "SELECT * FROM questions WHERE skill_id = ?",
          [skill.id]
        );
        skill.questions = questions;
      }
      res.json({ data: skills });
    } catch (err) {
      console.error("Error fetching skills with questions:", err);
      res
        .status(500)
        .json({ message: "Failed to fetch skills with questions" });
    }
  }
);

// GET all skills (without questions)
router.get(
  "/skills",
  /*isAdmin,*/ async (req, res) => {
    try {
      const [skills] = await pool.execute("SELECT * FROM skills");
      res.json({ data: skills });
    } catch (err) {
      console.error("Error fetching skills:", err);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  }
);

// PUT update a skill
router.put(
  "/skills/:id",
  /*isAdmin,*/ async (req, res) => {
    const { name, description } = req.body;
    try {
      const [result]: any = await pool.execute(
        "UPDATE skills SET name = ?, description = ? WHERE id = ?",
        [name, description, req.params.id]
      );
      if (!result || result.changes === 0) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json({ message: "Skill updated" });
    } catch (err) {
      console.error("Error updating skill:", err);
      res.status(500).json({ message: "Failed to update skill" });
    }
  }
);

// DELETE a skill
router.delete(
  "/skills/:id",
  /*isAdmin,*/ async (req, res) => {
    try {
      const [result]: any = await pool.execute(
        "DELETE FROM skills WHERE id = ?",
        [req.params.id]
      );
      if (!result || result.changes === 0) {
        return res.status(404).json({ message: "Skill not found" });
      }
      res.json({ message: "Skill deleted" });
    } catch (err) {
      console.error("Error deleting skill:", err);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  }
);

export default router;
