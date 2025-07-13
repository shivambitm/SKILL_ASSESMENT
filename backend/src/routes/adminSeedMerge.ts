import express from "express";
import fs from "fs";
import path from "path";
import { pool } from "../config/database";

const router = express.Router();

// Helper to read and parse seed scripts
function parseSeedScript(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Find the questions array in the script
    const match = content.match(/const questions = ([\s\S]*?);\n/);
    if (!match) return [];
    // eslint-disable-next-line no-eval
    const questions = eval(match[0].replace("const questions = ", ""));
    return questions;
  } catch (e) {
    return [];
  }
}

// GET merged skills/questions from DB and seed scripts
router.get("/merged-skills-questions", async (req, res) => {
  try {
    // 1. Get all skills from DB
    const [skills] = await pool.execute("SELECT * FROM skills");
    // 2. Get all questions from DB
    const [questions] = await pool.execute("SELECT * FROM questions");
    // 3. Map questions by skill_id
    const dbQuestionsBySkill: Record<number, any[]> = {};
    (questions as any[]).forEach((q) => {
      if (!dbQuestionsBySkill[q.skill_id]) dbQuestionsBySkill[q.skill_id] = [];
      dbQuestionsBySkill[q.skill_id].push({ ...q, source: "db" });
    });
    // 4. Read all seed scripts if scripts directory exists
    let seedQuestions: any[] = [];
    const scriptsDir = path.join(__dirname, "..", "scripts");
    if (fs.existsSync(scriptsDir)) {
      const files = fs
        .readdirSync(scriptsDir)
        .filter((f) => f.startsWith("seed_") && f.endsWith(".js"));
      files.forEach((file) => {
        const qs = parseSeedScript(path.join(scriptsDir, file));
        qs.forEach((q: any) => {
          // q[0] = skill_id
          seedQuestions.push({
            skill_id: q[0],
            question_text: q[1],
            option_a: q[2],
            option_b: q[3],
            option_c: q[4],
            option_d: q[5],
            correct_answer: q[6],
            is_active: q[7],
            source: "seed",
          });
        });
      });
    } else {
      console.warn(
        "[adminSeedMerge] scripts directory does not exist, skipping seed merging."
      );
    }
    // 5. Merge: for each skill, show DB questions and any seed questions not in DB (by question_text)
    const merged = (skills as any[]).map((skill) => {
      const dbQs = dbQuestionsBySkill[skill.id] || [];
      const seedQs = seedQuestions.filter((q) => q.skill_id === skill.id);
      // Remove seed questions that are already in DB (by question_text)
      const dbQTexts = new Set(dbQs.map((q) => q.question_text));
      const onlySeedQs = seedQs.filter((q) => !dbQTexts.has(q.question_text));
      // Add a visual flag for frontend: isSeedOnly
      const dbQsWithFlag = dbQs.map((q) => ({ ...q, isSeedOnly: false }));
      const onlySeedQsWithFlag = onlySeedQs.map((q) => ({
        ...q,
        isSeedOnly: true,
      }));
      return {
        ...skill,
        questions: [...dbQsWithFlag, ...onlySeedQsWithFlag],
      };
    });
    res.json({ data: merged });
  } catch (err) {
    console.error("Error merging skills/questions:", err);
    res.status(500).json({
      message: "Failed to merge skills/questions",
      error:
        err && typeof err === "object" && "message" in err
          ? (err as any).message
          : String(err),
    });
  }
});

export default router;
