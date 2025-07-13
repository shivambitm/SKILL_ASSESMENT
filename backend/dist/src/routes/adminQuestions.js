"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
// Edit a question
router.put("/questions/:id", async (req, res) => {
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, is_active, } = req.body;
    await database_1.pool.execute("UPDATE questions SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, difficulty=?, is_active=? WHERE id=?", [
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        difficulty,
        is_active,
        req.params.id,
    ]);
    res.json({ message: "Question updated" });
});
// Add a question
router.post("/questions", async (req, res) => {
    const { skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, is_active, } = req.body;
    await database_1.pool.execute("INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        skill_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        difficulty,
        is_active,
    ]);
    res.json({ message: "Question added" });
});
// Delete a question
router.delete("/questions/:id", async (req, res) => {
    await database_1.pool.execute("DELETE FROM questions WHERE id=?", [req.params.id]);
    res.json({ message: "Question deleted" });
});
exports.default = router;
//# sourceMappingURL=adminQuestions.js.map