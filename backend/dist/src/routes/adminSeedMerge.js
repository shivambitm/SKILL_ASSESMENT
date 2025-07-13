"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
// Helper to read and parse seed scripts
function parseSeedScript(filePath) {
    try {
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        // Find the questions array in the script
        const match = content.match(/const questions = ([\s\S]*?);\n/);
        if (!match)
            return [];
        // eslint-disable-next-line no-eval
        const questions = eval(match[0].replace("const questions = ", ""));
        return questions;
    }
    catch (e) {
        return [];
    }
}
// GET merged skills/questions from DB and seed scripts
router.get("/merged-skills-questions", async (req, res) => {
    try {
        // 1. Get all skills from DB
        const [skills] = await database_1.pool.execute("SELECT * FROM skills");
        // 2. Get all questions from DB
        const [questions] = await database_1.pool.execute("SELECT * FROM questions");
        // 3. Map questions by skill_id
        const dbQuestionsBySkill = {};
        questions.forEach((q) => {
            if (!dbQuestionsBySkill[q.skill_id])
                dbQuestionsBySkill[q.skill_id] = [];
            dbQuestionsBySkill[q.skill_id].push({ ...q, source: "db" });
        });
        // 4. Read all seed scripts if scripts directory exists
        let seedQuestions = [];
        const scriptsDir = path_1.default.join(__dirname, "..", "scripts");
        if (fs_1.default.existsSync(scriptsDir)) {
            const files = fs_1.default
                .readdirSync(scriptsDir)
                .filter((f) => f.startsWith("seed_") && f.endsWith(".js"));
            files.forEach((file) => {
                const qs = parseSeedScript(path_1.default.join(scriptsDir, file));
                qs.forEach((q) => {
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
        }
        else {
            console.warn("[adminSeedMerge] scripts directory does not exist, skipping seed merging.");
        }
        // 5. Merge: for each skill, show DB questions and any seed questions not in DB (by question_text)
        const merged = skills.map((skill) => {
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
    }
    catch (err) {
        console.error("Error merging skills/questions:", err);
        res.status(500).json({
            message: "Failed to merge skills/questions",
            error: err && typeof err === "object" && "message" in err
                ? err.message
                : String(err),
        });
    }
});
exports.default = router;
//# sourceMappingURL=adminSeedMerge.js.map