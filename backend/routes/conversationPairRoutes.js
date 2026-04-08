const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { createPair, getPairsByProgram } = require("../controllers/conversationPairController");

// POST /api/conversation-pairs  — Admin registers two participants as a pair
router.post("/", protect, restrictTo("admin"), createPair);

// GET /api/conversation-pairs/by-program/:programId — Admin & Judge fetch pairs for judge UI
router.get("/by-program/:programId", protect, getPairsByProgram);

module.exports = router;
