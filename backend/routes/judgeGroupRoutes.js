const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getJudgeGroups,
  createJudgeGroup,
  updateJudgeGroup,
  deleteJudgeGroup,
} = require("../controllers/judgeGroupController");

router.use(protect);
router.route("/").get(restrictTo("admin"), getJudgeGroups).post(restrictTo("admin"), createJudgeGroup);
router.route("/:id").patch(restrictTo("admin"), updateJudgeGroup).delete(restrictTo("admin"), deleteJudgeGroup);

module.exports = router;
