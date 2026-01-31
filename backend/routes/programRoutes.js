const express = require("express");
const router = express.Router();
const {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} = require("../controllers/programController");

router.route("/").get(getPrograms).post(createProgram);
router.route("/:id").patch(updateProgram).delete(deleteProgram);

module.exports = router;
