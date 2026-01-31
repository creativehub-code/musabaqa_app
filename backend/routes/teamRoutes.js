const express = require("express");
const router = express.Router();
const {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

router.route("/").get(getTeams).post(createTeam);

router.route("/:id").put(updateTeam).delete(deleteTeam);

module.exports = router;
