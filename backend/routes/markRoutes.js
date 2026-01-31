const express = require("express");
const router = express.Router();
const {
  submitMark,
  getMarksByProgram,
  calculateScores,
} = require("../controllers/markController");

router.post("/", submitMark);
router.get("/:programId", getMarksByProgram);
router.post("/calculate/:programId", calculateScores);

module.exports = router;
