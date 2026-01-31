const JudgeMark = require("../models/JudgeMark");
const Participant = require("../models/Participant");
const Team = require("../models/Team");
const Group = require("../models/Group");
const Program = require("../models/Program");

// @desc    Submit or Updates marks (Judge)
// @route   POST /api/marks
// @access  Judge
const submitMark = async (req, res) => {
  try {
    const { judgeId, programId, participantId, marksGiven } = req.body;

    // Check if locked/submitted? Logic can be added here.

    let markEntry = await JudgeMark.findOne({
      judgeId,
      programId,
      participantId,
    });

    if (markEntry) {
      markEntry.marksGiven = marksGiven;
      await markEntry.save();
    } else {
      markEntry = await JudgeMark.create({
        judgeId,
        programId,
        participantId,
        marksGiven,
      });
    }

    res.json(markEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get marks for a program (Admin/Judge)
// @route   GET /api/marks/:programId
const getMarksByProgram = async (req, res) => {
  try {
    const marks = await JudgeMark.find({ programId: req.params.programId })
      .populate({
        path: "participantId",
        select: "name chestNumber teamId",
        populate: {
          path: "teamId",
          select: "name",
        },
      })
      .populate("judgeId", "name");
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate Scores and Update Totals (Admin Trigger)
// @route   POST /api/marks/calculate/:programId
const calculateScores = async (req, res) => {
  try {
    const { programId } = req.params;
    // This is a simplified calculation trigger.
    // In a real app, we might recalculate everything or just this program.

    // 1. Get all marks for this program
    const marks = await JudgeMark.find({ programId });

    // 2. Aggregate scores per participant
    const participantScores = {};
    marks.forEach((mark) => {
      if (!participantScores[mark.participantId]) {
        participantScores[mark.participantId] = 0;
      }
      participantScores[mark.participantId] += mark.marksGiven;
    });

    // 3. Update Participants Total Score (Resetting and re-adding is safer but complex for MVP)
    // For MVP, lets assume we just "Add" to total score? No, that duplicates if run twice.
    // Strategy: We should probably store "ProgramScore" separately or just update Participant.totalScore
    // correctly by recalculating ALL scores for that participant.

    // Better MVP Strategy:
    // Participant.totalScore = Sum(All JudgeMarks for this participant) + PositionPoints.
    // We can run a global recalculation for affected applicants.

    for (const [partId, score] of Object.entries(participantScores)) {
      await Participant.findByIdAndUpdate(partId, { totalScore: score }); // This overwrites logic if they have multiple programs?
      // If checking multiple programs, we need to sum ALL marks for participant.

      // Re-query all marks for this participant across ALL programs
      const allMarks = await JudgeMark.find({ participantId: partId });
      const totalJudgeScore = allMarks.reduce(
        (sum, m) => sum + m.marksGiven,
        0,
      );

      // Add Position Points (TODO: Store these somewhere)
      // For now, just Judge Marks.

      await Participant.findByIdAndUpdate(partId, {
        totalScore: totalJudgeScore,
      });
    }

    res.json({ message: "Scores recalculated", participantScores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitMark, getMarksByProgram, calculateScores };
