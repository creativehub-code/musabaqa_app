const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getJudges,
  createJudge,
  getMe,
  deleteJudge,
} = require("../controllers/judgeController");

router.use(protect);
router.route("/").get(restrictTo("admin"), getJudges).post(restrictTo("admin"), createJudge);
router.route("/me/:id").get(getMe);
router.route("/:id").delete(restrictTo("admin"), deleteJudge);

module.exports = router;
