const express = require("express");
const router = express.Router();
const {
  getJudges,
  createJudge,
  getMe,
  deleteJudge,
} = require("../controllers/judgeController");

router.route("/").get(getJudges).post(createJudge);
router.route("/me/:id").get(getMe);
router.route("/:id").delete(deleteJudge);

module.exports = router;
