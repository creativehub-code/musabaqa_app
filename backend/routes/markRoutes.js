const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  submitMark,
  getMarksByProgram,
  calculateScores,
} = require("../controllers/markController");

router.post("/", protect, restrictTo("admin", "judge"), submitMark);
router.get("/:programId", getMarksByProgram);
router.post("/calculate/:programId", protect, restrictTo("admin"), calculateScores);

module.exports = router;
