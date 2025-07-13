"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Stub: GET all users (returns empty array for now)
router.get("/users", (req, res) => {
    res.json({ data: [] });
});
exports.default = router;
//# sourceMappingURL=adminUsers.js.map