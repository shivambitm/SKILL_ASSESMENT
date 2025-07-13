import express from "express";
const router = express.Router();

// Stub: GET all users (returns empty array for now)
router.get("/users", (req, res) => {
  res.json({ data: [] });
});

export default router;
