const JudgeMark = require("../models/JudgeMark");
const JudgeGroup = require("../models/JudgeGroup");
const Participant = require("../models/Participant");
const Team = require("../models/Team");
const Group = require("../models/Group");
const Program = require("../models/Program");
const Setting = require("../models/Setting");
const ProgramResult = require("../models/ProgramResult");
const ConversationPair = require("../models/ConversationPair");
const { updateGoogleSheet } = require("../utils/googleSheets");
const sseManager = require("../utils/sseManager");

// @desc    Submit or Updates marks (Judge)
// @route   POST /api/marks
// @access  Judge
const submitMark = async (req, res) => {
  try {
    const { programId, participantId, marksGiven } = req.body;

    // Security: Forced to use the authenticated judge's ID from req.user.
    // This prevents one judge from submitting marks as another.
    const judgeId = req.user.id;

    if (!programId || !participantId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ── SECURITY PATCH: IDOR / Broken Access Control Fix ─────────────────────────
    // Verify the requesting judge is actually assigned to this specific program
    // via a JudgeGroup. Without this check, any authenticated judge could submit
    // marks for programs they have no business scoring (IDOR vulnerability).
    const assignedGroup = await JudgeGroup.findOne({
      judges: judgeId,
      assignedPrograms: programId,
    });

    if (!assignedGroup) {
      return res.status(403).json({
        message: "Unauthorized: You are not assigned to judge this program.",
      });
    }
    // ─────────────────────────────────────────────────────────────────────────────

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

    // Populate for the SSE broadcast so the admin table can immediately render
    // judge name and participant details without a separate fetch.
    const populated = await JudgeMark.findById(markEntry._id)
      .populate({ path: "participantId", select: "name chestNumber teamId", populate: { path: "teamId", select: "name" } })
      .populate("judgeId", "name");

    // Fetch program metadata for the admin toast notification.
    const program = await Program.findById(programId).select("name language");

    // Build the broadcast payload: the mark data + a _notification block for the toast.
    // The underscore prefix signals to the frontend that this field is UI-only metadata.
    const broadcastPayload = {
      ...populated.toObject(),
      _notification: {
        judgeName: populated.judgeId?.name || "A Judge",
        programName: program?.name || "a program",
        language: program?.language || "",
      },
    };

    // Broadcast to all admin SSE clients watching this program.
    sseManager.broadcast(programId, broadcastPayload);

    // ── Conversation group: auto-mirror mark to ALL group members ──────────────
    // If this participant is the primary of a conversation group, upsert the
    // exact same mark for ALL other members so everyone's score stays in sync.
    const group = await ConversationPair.findOne({
      programId,
      primaryParticipantId: participantId,
    });
    
    if (group && group.participants && group.participants.length > 1) {
      const otherMemberIds = group.participants.filter(
        id => id.toString() !== participantId.toString()
      );
      
      const mirroringPromises = otherMemberIds.map(memberId => 
        JudgeMark.findOneAndUpdate(
          { judgeId, programId, participantId: memberId },
          { marksGiven, submitted: false },
          { upsert: true, new: true }
        )
      );
      
      await Promise.all(mirroringPromises);
    }

    res.json(markEntry);
  } catch (error) {
    res.status(400).json({ message: "Error submitting mark" });
  }
};

// @desc    Get marks for a program (Admin/Judge)
// @route   GET /api/marks/:programId
const getMarksByProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    // 1. Get all submitted marks for this program
    const marks = await JudgeMark.find({ programId })
      .populate({
        path: "participantId",
        select: "name chestNumber teamId",
        populate: {
          path: "teamId",
          select: "name",
        },
      })
      .populate("judgeId", "name");

    // 2. Identify all assigned judges for this program (via JudgeGroups)
    const judgeGroups = await JudgeGroup.find({ assignedPrograms: programId }).populate("judges", "name");
    
    // Create a unique set of assigned judges
    const assignedJudgesMap = {}; // { id: name }
    judgeGroups.forEach(group => {
      if (group.judges && group.judges.length > 0) {
        group.judges.forEach(j => {
          assignedJudgesMap[j._id.toString()] = { 
            _id: j._id, 
            name: j.name || "Unknown Judge" 
          };
        });
      }
    });

    const assignedJudges = Object.values(assignedJudgesMap);

    res.json({
      marks,
      assignedJudges
    });
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
          currentPosition++; // Dense rank (e.g., 1, 1, 2, 3)
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
    // TotalScore = Sum of ALL Position Points (Judges marks are only for ranking)
    const affectedParticipantIds = [
      ...new Set(marks.map((mark) => mark.participantId.toString())),
    ];
    const affectedTeamIds = new Set();

    for (const partId of affectedParticipantIds) {
      const allResults = await ProgramResult.find({ participantId: partId });
      const totalPositionScore = allResults.reduce(
        (sum, r) => sum + (r.positionPoints || 0),
        0,
      );

      const finalScore = totalPositionScore;

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

    // 9. Update program status to completed
    await Program.findByIdAndUpdate(programId, { status: "completed" });

    // 10. Populate the position awards for the frontend results panel
    const populatedResults = await ProgramResult.find({ programId })
      .populate({ path: "participantId", select: "name chestNumber teamId", populate: { path: "teamId", select: "name" } })
      .sort({ position: 1 });

    res.json({
      message: "Scores & rankings recalculated successfully",
      participantsUpdated: affectedParticipantIds.length,
      teamsUpdated: affectedTeamIds.size,
      resultsAwarded: positionAwards.length,
      positionResults: populatedResults, // For the frontend results panel
    });
  } catch (error) {
    console.error("Calculate Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export Marks & Ranks to Google Sheets
// @route   POST /api/marks/export-sheets/:programId
const exportToGoogleSheets = async (req, res) => {
  try {
    const { programId } = req.params;

    // 1. Get Program Details
    const program = await Program.findById(programId).populate('groupId', 'name');
    if (!program) return res.status(404).json({ message: "Program not found" });

    // 2. Get all marks for this program
    const marks = await JudgeMark.find({ programId })
      .populate({
        path: "participantId",
        select: "name chestNumber teamId",
        populate: { path: "teamId", select: "name" },
      })
      .populate("judgeId", "name");

    if (marks.length === 0) {
      return res.status(400).json({ message: "No marks found to export." });
    }

    // 3. Identify all assigned judges for this program (via JudgeGroups)
    const judgeGroups = await JudgeGroup.find({ assignedPrograms: programId }).populate("judges", "name");
    
    // Create a unique set of assigned judges
    const assignedJudgesMap = {}; // { id: name }
    judgeGroups.forEach(group => {
      if (group.judges && group.judges.length > 0) {
        group.judges.forEach(j => {
          assignedJudgesMap[j._id.toString()] = j.name || "Unknown Judge";
        });
      }
    });

    const judgesList = Object.values(assignedJudgesMap); // All judge names for headers
    const judgeIdsList = Object.keys(assignedJudgesMap); // All judge IDs to map marks

    // 4. Aggregate marks for each participant
    const participantMap = {};
    
    marks.forEach((m) => {
      const pId = m.participantId?._id?.toString();
      const jId = m.judgeId?._id?.toString();

      if (!pId) return;

      if (!participantMap[pId]) {
        participantMap[pId] = {
          participant: m.participantId,
          totalScore: 0,
          judgeMarks: {}, // { "judgeId": mark }
        };
      }
      
      if (jId) {
        // Store mark by ID for precise matching
        participantMap[pId].judgeMarks[jId] = m.marksGiven || 0;
        participantMap[pId].totalScore += m.marksGiven || 0;
      }
    });

    // 5. Sort and Rank (Dense Ranking)
    const sortedParticipants = Object.values(participantMap).sort(
      (a, b) => b.totalScore - a.totalScore
    );

    let currentRank = 1;
    for (let i = 0; i < sortedParticipants.length; i++) {
        if (i > 0 && sortedParticipants[i].totalScore < sortedParticipants[i-1].totalScore) {
            currentRank++;
        }
        sortedParticipants[i].rank = currentRank;
    }

    // 6. Format Data for Google Sheets
    // Headers: [SI No, Name, Chest, Team, Judge1, Judge2..., Total, Rank]
    const headers = [
        "SI No", 
        "Participant Name", 
        "Chest No", 
        "Team", 
        ...judgesList, 
        "Total Marks", 
        "Rank"
    ];
    const sheetData = [headers];

    // Rows
    sortedParticipants.forEach((item, index) => {
        const row = [
            index + 1,
            item.participant?.name || "N/A",
            item.participant?.chestNumber || "N/A",
            item.participant?.teamId?.name || "N/A",
        ];

        // Add each assigned judge's mark
        judgeIdsList.forEach(jId => {
            row.push(item.judgeMarks[jId] || 0);
        });

        row.push(item.totalScore);
        row.push(item.rank);
        
        sheetData.push(row);
    });

    // 7. Update Google Sheets
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) throw new Error("GOOGLE_SHEET_ID not configured in .env");

    const groupName = program.groupId ? program.groupId.name : 'General';
    const tabName = `${program.name} - ${groupName}`;
    await updateGoogleSheet(sheetId, tabName, sheetData);

    res.json({ message: `Successfully exported to Google Sheet tab: ${tabName}` });
  } catch (error) {
    console.error("Export Sheets Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public results for a completed program
// @route   GET /api/public/results/:programId
const getPublicResults = async (req, res) => {
  try {
    const { programId } = req.params;
    const program = await Program.findById(programId);

    if (!program || program.status !== "completed") {
      return res.status(403).json({ message: "Results for this program are not published yet." });
    }

    const results = await ProgramResult.find({ programId })
      .populate({
        path: "participantId",
        select: "name chestNumber teamId",
        populate: {
          path: "teamId",
          select: "name",
        },
      })
      .select("position positionPoints participantId")
      .sort({ position: 1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Open an SSE stream for live mark updates on a program (Admin)
// @route   GET /api/marks/stream/:programId
// @access  Admin
const streamMarks = (req, res) => {
  const { programId } = req.params;

  // --- SSE Headers ---
  // Content-Type must be text/event-stream.
  // Cache-Control: no-cache prevents proxies from buffering the stream.
  // X-Accel-Buffering: no disables Nginx proxy buffering (important for production).
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send an initial comment to confirm the stream is open.
  // This also prevents some proxies from closing the connection immediately.
  res.write(": connected\n\n");

  // Register the client in the SSE manager.
  sseManager.addClient(programId, res);

  // --- Memory Leak Prevention (CRITICAL) ---
  // When the client disconnects (navigates away, closes tab, component unmounts),
  // Express fires the 'close' event on req. We must clean up immediately.
  req.on("close", () => {
    sseManager.removeClient(programId, res);
  });
};

module.exports = {
  submitMark,
  getMarksByProgram,
  calculateScores,
  exportToGoogleSheets,
  getPublicResults,
  streamMarks,
};

