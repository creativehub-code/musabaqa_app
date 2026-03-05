const express = require("express");
const router = express.Router();
const {
  getJudgeGroups,
  createJudgeGroup,
  updateJudgeGroup,
  deleteJudgeGroup,
} = require("../controllers/judgeGroupController");

router.route("/").get(getJudgeGroups).post(createJudgeGroup);
router.route("/:id").patch(updateJudgeGroup).delete(deleteJudgeGroup);

module.exports = router;
