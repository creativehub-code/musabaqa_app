const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  submitMark,
  getMarksByProgram,
  calculateScores,
} = require("../controllers/markController");

router.use(protect);
router.post("/", restrictTo("admin", "judge"), submitMark);
router.get("/:programId", restrictTo("admin", "judge"), getMarksByProgram);
router.post("/calculate/:programId", restrictTo("admin"), calculateScores);

module.exports = router;
