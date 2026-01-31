const Program = require("../models/Program");

const getPrograms = async (req, res) => {
  try {
    const programs = await Program.find().populate("groupId");
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProgram = async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).json(program);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    res.json(program);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findByIdAndDelete(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPrograms, createProgram, updateProgram, deleteProgram };
