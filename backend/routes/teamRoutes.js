const express = require("express");
const router = express.Router();
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

router.route("/").get(getTeams).post(createTeam);

router.route("/:id").get(getTeamById).put(updateTeam).delete(deleteTeam);

module.exports = router;
