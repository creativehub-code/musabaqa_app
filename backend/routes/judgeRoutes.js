const express = require("express");
const router = express.Router();
const {
  getJudges,
  createJudge,
  deleteJudge,
} = require("../controllers/judgeController");

router.route("/").get(getJudges).post(createJudge);
router.route("/:id").delete(deleteJudge);

module.exports = router;
