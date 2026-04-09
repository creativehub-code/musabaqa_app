const Judge = require("../models/Judge");
const Program = require("../models/Program");
const JudgeMark = require("../models/JudgeMark");

// @desc    Get all judges
// @route   GET /api/judges
// @access  Public (should be Admin)
const getJudges = async (req, res) => {
  try {
    const judges = await Judge.find().populate("judgeGroupId");
    res.json(judges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in judge profile
// @route   GET /api/judges/me/:id
// @access  Public (Should be protected)
const getMe = async (req, res) => {
  try {
    // Security: Only allow fetching the profile of the CURRENTLY logged-in user
    // req.user is populated by the 'protect' middleware
    const judge = await Judge.findById(req.user.id).populate("judgeGroupId");
    
    if (!judge) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find programs for which this judge has already submitted marks
    const evaluatedPrograms = await JudgeMark.find({ judgeId: req.user.id }).distinct('programId');
    
    res.json({
      _id: judge._id,
      name: judge.name,
      email: judge.email || null,
      username: judge.username || null,
      category: judge.category || null,
      role: judge.role,
      assignedPrograms: judge.judgeGroupId
        ? judge.judgeGroupId.assignedPrograms
        : [],
      judgeGroupId: judge.judgeGroupId ? judge.judgeGroupId._id : null,
      evaluatedPrograms: evaluatedPrograms || [],
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create a new judge
// @route   POST /api/judges
// @access  Public (should be Admin)
const createJudge = async (req, res) => {
  let { name, email, password, assignedProgramIds } = req.body;
  if (email) email = email.trim().toLowerCase();
  if (password) password = password.trim();

  try {
    const judgeExists = await Judge.findOne({ email });

    if (judgeExists) {
      return res.status(400).json({ message: "Judge already exists" });
    }

    const judge = await Judge.create({
      name,
      email,
      password, // Plaintext for MVP as requested
      assignedPrograms: assignedProgramIds || [],
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
  getMe,
  createJudge,
  deleteJudge,
};
