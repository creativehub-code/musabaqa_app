const JudgeMark = require("../models/JudgeMark");
const Participant = require("../models/Participant");
const Team = require("../models/Team");
const Group = require("../models/Group");
const Program = require("../models/Program");
const Setting = require("../models/Setting");
const ProgramResult = require("../models/ProgramResult");

// @desc    Submit or Updates marks (Judge)
// @route   POST /api/marks
// @access  Judge
const submitMark = async (req, res) => {
  try {
    const { judgeId, programId, participantId, marksGiven } = req.body;

    if (!judgeId || !programId || !participantId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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

    // 1. Get all marks for this program
    const marks = await JudgeMark.find({ programId });

    if (marks.length === 0) {
      return res
        .status(400)
        .json({ message: "No marks found for this program to verify." });
    }

    // 2. Clear old program results for this program if re-verifying
    await ProgramResult.deleteMany({ programId });

    // 3. Aggregate marks for each participant in THIS program
    const programScores = {};
    marks.forEach((mark) => {
      const pId = mark.participantId.toString();
      if (!programScores[pId]) programScores[pId] = 0;
      programScores[pId] += mark.marksGiven || 0;
    });

    // 4. Sort participants by total marks in descending order
    const sortedParticipants = Object.keys(programScores).sort(
      (a, b) => programScores[b] - programScores[a],
    );

    // 5. Fetch Points Settings
    let settings = await Setting.findOne();
    if (!settings) {
      settings = {
        firstPlacePoints: 5,
        secondPlacePoints: 3,
        thirdPlacePoints: 1,
      };
    }

    // 6. Assign Positions and Points (Handling exact ties)
    const positionAwards = [];
    let currentPosition = 1;
    let rankPoints = settings.firstPlacePoints;

    for (let i = 0; i < sortedParticipants.length; i++) {
      const pId = sortedParticipants[i];
      const currentScore = programScores[pId];

      // Change position only if score is less than the previous person
      if (i > 0) {
        const prevPId = sortedParticipants[i - 1];
        if (currentScore < programScores[prevPId]) {
          currentPosition = i + 1; // 0-indexed to 1-indexed true rank (e.g., 1, 1, 3)
        }
      }

      // Only top 3 true positions get points
      if (currentPosition === 1) rankPoints = settings.firstPlacePoints;
      else if (currentPosition === 2) rankPoints = settings.secondPlacePoints;
      else if (currentPosition === 3) rankPoints = settings.thirdPlacePoints;
      else rankPoints = 0;

      if (rankPoints > 0) {
        positionAwards.push({
          programId,
          participantId: pId,
          position: currentPosition,
          positionPoints: rankPoints,
        });
      }
    }

    // Save the new program results
    if (positionAwards.length > 0) {
      await ProgramResult.insertMany(positionAwards);
    }

    // 7. Global Recalculation: Update totalScore for each affected participant
    // TotalScore = (Sum of ALL Judge Marks) + (Sum of ALL Position Points)
    const affectedParticipantIds = [
      ...new Set(marks.map((mark) => mark.participantId.toString())),
    ];
    const affectedTeamIds = new Set();

    for (const partId of affectedParticipantIds) {
      const allMarks = await JudgeMark.find({ participantId: partId });
      const totalJudgeScore = allMarks.reduce(
        (sum, m) => sum + (m.marksGiven || 0),
        0,
      );

      const allResults = await ProgramResult.find({ participantId: partId });
      const totalPositionScore = allResults.reduce(
        (sum, r) => sum + (r.positionPoints || 0),
        0,
      );

      const finalScore = totalJudgeScore + totalPositionScore;

      // Update Participant
      const updatedParticipant = await Participant.findByIdAndUpdate(
        partId,
        { totalScore: finalScore },
        { new: true },
      );

      if (updatedParticipant && updatedParticipant.teamId) {
        affectedTeamIds.add(updatedParticipant.teamId.toString());
      }
    }

    // 8. Global Recalculation: Update totalScore for each affected team
    for (const teamId of affectedTeamIds) {
      const teamParticipants = await Participant.find({ teamId });
      const teamTotalScore = teamParticipants.reduce(
        (sum, p) => sum + (p.totalScore || 0),
        0,
      );

      await Team.findByIdAndUpdate(teamId, { totalScore: teamTotalScore });
    }

    res.json({
      message: "Scores & rankings recalculated successfully",
      participantsUpdated: affectedParticipantIds.length,
      teamsUpdated: affectedTeamIds.size,
      resultsAwarded: positionAwards.length,
    });
  } catch (error) {
    console.error("Calculate Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitMark, getMarksByProgram, calculateScores };
