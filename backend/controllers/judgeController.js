const Judge = require("../models/Judge");
const Program = require("../models/Program");

// @desc    Get all judges
// @route   GET /api/judges
// @access  Public (should be Admin)
const getJudges = async (req, res) => {
  try {
    const judges = await Judge.find().populate("assignedPrograms");
    res.json(judges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new judge
// @route   POST /api/judges
// @access  Public (should be Admin)
const createJudge = async (req, res) => {
  const { name, email, password, assignedProgramId } = req.body;

  try {
    const judgeExists = await Judge.findOne({ email });

    if (judgeExists) {
      return res.status(400).json({ message: "Judge already exists" });
    }

    // Assign program if provided
    let assignedPrograms = [];
    if (assignedProgramId) {
      assignedPrograms.push(assignedProgramId);
    }

    const judge = await Judge.create({
      name,
      email,
      password, // Plaintext for MVP as requested
      assignedPrograms,
    });

    if (judge) {
      res.status(201).json({
        _id: judge._id,
        name: judge.name,
        email: judge.email,
        assignedPrograms: judge.assignedPrograms,
      });
    } else {
      res.status(400).json({ message: "Invalid judge data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a judge
// @route   DELETE /api/judges/:id
// @access  Public (should be Admin)
const deleteJudge = async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id);

    if (!judge) {
      return res.status(404).json({ message: "Judge not found" });
    }

    await judge.deleteOne();
    res.json({ message: "Judge removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJudges,
  createJudge,
  deleteJudge,
};
