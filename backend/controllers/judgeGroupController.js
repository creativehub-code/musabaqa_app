const JudgeGroup = require("../models/JudgeGroup");
const Judge = require("../models/Judge");

// @desc    Get all judge groups
// @route   GET /api/judgeGroups
// @access  Public (should be Admin)
const getJudgeGroups = async (req, res) => {
  try {
    const judgeGroups = await JudgeGroup.find()
      .populate("judges")
      .populate({
        path: "assignedPrograms",
        populate: { path: "groupId" },
      });
    res.json(judgeGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new judge group
// @route   POST /api/judgeGroups
// @access  Public (should be Admin)
const createJudgeGroup = async (req, res) => {
  const { name, judges: newJudges, assignedProgramIds } = req.body;

  try {
    // 1. Create the JudgeGroup document first
    const judgeGroup = await JudgeGroup.create({
      name,
      assignedPrograms: assignedProgramIds || [],
    });

    // 2. Create the Judge documents
    const createdJudges = [];
    if (newJudges && newJudges.length > 0) {
      for (const judgeData of newJudges) {
        let email = judgeData.email ? judgeData.email.trim() : "";
        const existingJudge = await Judge.findOne({ email });
        if (existingJudge) {
          // rollback everything if email exists
          await JudgeGroup.findByIdAndDelete(judgeGroup._id);
          for (const created of createdJudges) {
            await Judge.findByIdAndDelete(created._id);
          }
          return res
            .status(400)
            .json({ message: `Judge email ${email} already exists.` });
        }

        const judge = await Judge.create({
          name: judgeData.name,
          email,
          password: judgeData.password,
          judgeGroupId: judgeGroup._id,
        });
        createdJudges.push(judge._id);
      }
    }

    // 3. Update the JudgeGroup with the newly created Judge IDs
    judgeGroup.judges = createdJudges;
    await judgeGroup.save();

    res.status(201).json(judgeGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a judge group
// @route   DELETE /api/judgeGroups/:id
// @access  Public (should be Admin)
const deleteJudgeGroup = async (req, res) => {
  try {
    const judgeGroup = await JudgeGroup.findById(req.params.id);

    if (!judgeGroup) {
      return res.status(404).json({ message: "Judge Group not found" });
    }

    // Delete all associated judges
    if (judgeGroup.judges && judgeGroup.judges.length > 0) {
      await Judge.deleteMany({ _id: { $in: judgeGroup.judges } });
    }

    await judgeGroup.deleteOne();
    res.json({ message: "Judge Group and its associated judges removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a judge group (e.g., adding/removing programs)
// @route   PATCH /api/judgeGroups/:id
// @access  Public (should be Admin)
const updateJudgeGroup = async (req, res) => {
  try {
    const { assignedProgramIds } = req.body;

    // We expect the frontend to pass the entire new array of assigned programs
    // if editing the group's assigned programs.
    const judgeGroup = await JudgeGroup.findByIdAndUpdate(
      req.params.id,
      { assignedPrograms: assignedProgramIds || [] },
      { new: true },
    );

    if (!judgeGroup) {
      return res.status(404).json({ message: "Judge Group not found" });
    }

    res.json(judgeGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJudgeGroups,
  createJudgeGroup,
  updateJudgeGroup,
  deleteJudgeGroup,
};
