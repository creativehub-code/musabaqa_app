const express = require("express");
const router = express.Router();
const {
  getParticipants,
  getParticipantById,
  getParticipantPhoto,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} = require("../controllers/participantController");

// For MVP, we might skip middleware for read, but should protect write.
// Since we don't have middleware protecting routes yet, we'll just define endpoints.
// TODO: Add auth middleware for POST/PUT/DELETE

router.route("/:id/photo").get(getParticipantPhoto);
router.route("/").get(getParticipants).post(createParticipant);

router
  .route("/:id")
  .get(getParticipantById)
  .put(updateParticipant)
  .delete(deleteParticipant);

module.exports = router;
