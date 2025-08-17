"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const router = express_1.default.Router();
// GET all skills with their questions (from DB)
router.get("/skills-with-questions", 
/*isAdmin,*/ async (req, res) => {
    try {
        const skills = await models_1.Skill.find();
        const skillsWithQuestions = [];
        for (const skill of skills) {
            const questions = await models_1.Question.find({ skill_id: skill._id });
            skillsWithQuestions.push({
                ...skill.toObject(),
                questions
            });
        }
        res.json({ data: skillsWithQuestions });
    }
    catch (err) {
        console.error("Error fetching skills with questions:", err);
        res
            .status(500)
            .json({ message: "Failed to fetch skills with questions" });
    }
});
// GET all skills (without questions)
router.get("/skills", 
/*isAdmin,*/ async (req, res) => {
    try {
        const skills = await models_1.Skill.find();
        res.json({ data: skills });
    }
    catch (err) {
        console.error("Error fetching skills:", err);
        res.status(500).json({ message: "Failed to fetch skills" });
    }
});
// PUT update a skill
router.put("/skills/:id", 
/*isAdmin,*/ async (req, res) => {
    const { name, description } = req.body;
    try {
        const skill = await models_1.Skill.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }
        res.json({ message: "Skill updated", data: skill });
    }
    catch (err) {
        console.error("Error updating skill:", err);
        res.status(500).json({ message: "Failed to update skill" });
    }
});
// DELETE a skill
router.delete("/skills/:id", 
/*isAdmin,*/ async (req, res) => {
    try {
        const skill = await models_1.Skill.findByIdAndDelete(req.params.id);
        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }
        // Also delete associated questions
        await models_1.Question.deleteMany({ skill_id: req.params.id });
        res.json({ message: "Skill deleted" });
    }
    catch (err) {
        console.error("Error deleting skill:", err);
        res.status(500).json({ message: "Failed to delete skill" });
    }
});
exports.default = router;
//# sourceMappingURL=adminSkills.js.map