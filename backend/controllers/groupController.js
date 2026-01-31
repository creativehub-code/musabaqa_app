const Group = require("../models/Group");

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate({
      path: "participantIds",
      populate: { path: "teamId", select: "name" },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByIdAndDelete(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGroups, createGroup, deleteGroup };
