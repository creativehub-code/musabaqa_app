const express = require("express");
const router = express.Router();
const {
  getGroups,
  createGroup,
  deleteGroup,
} = require("../controllers/groupController");

router.route("/").get(getGroups).post(createGroup);
router.route("/:id").delete(deleteGroup);

module.exports = router;
