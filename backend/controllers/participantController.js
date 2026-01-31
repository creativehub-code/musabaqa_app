const Participant = require("../models/Participant");
const Team = require("../models/Team");
const Group = require("../models/Group");

// @desc    Get all participants
// @route   GET /api/participants
// @access  Public (Read-only), Admin/Judge (Read-only)
// @desc    Get all participants (Lightweight - No Image)
// @route   GET /api/participants
// @access  Public (Read-only), Admin/Judge (Read-only)
const getParticipants = async (req, res) => {
  try {
    const participants = await Participant.find()
      .select("-image") // Exclude image for performance
      .populate("teamId", "name")
      .populate("groupId", "name")
      .populate("programs", "name language")
      .sort({ createdAt: -1 });
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single participant (No Image)
// @route   GET /api/participants/:id
// @access  Public/Admin
const getParticipantById = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .select("-image") // Exclude image, use /photo endpoint
      .populate("teamId", "name")
      .populate("groupId", "name")
      .populate("programs", "name language");

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(participant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get participant photo
// @route   GET /api/participants/:id/photo
// @access  Public
const getParticipantPhoto = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id).select(
      "image",
    );

    if (!participant || !participant.image) {
      return res.status(404).send("Photo not found");
    }

    const matches = participant.image.match(
      /^data:([A-Za-z-+\/]+);base64,(.+)$/,
    );
    if (!matches || matches.length !== 3) {
      return res.status(400).send("Invalid image data");
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a participant
// @route   POST /api/participants
// @access  Admin
const createParticipant = async (req, res) => {
  try {
    const { name, chestNumber, teamId, groupId, programs } = req.body;

    const participantExists = await Participant.findOne({ chestNumber });
    if (participantExists) {
      return res
        .status(400)
        .json({ message: "Participant with this chest number already exists" });
    }

    const participant = await Participant.create({
      name,
      chestNumber,
      teamId,
      groupId,
      programs: programs || [],
      image: req.body.image || "",
    });

    if (teamId) {
      await Team.findByIdAndUpdate(teamId, {
        $push: { participantIds: participant._id },
      });
    }

    if (groupId) {
      await Group.findByIdAndUpdate(groupId, {
        $push: { participantIds: participant._id },
      });
    }

    res.status(201).json(participant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update participant
// @route   PUT /api/participants/:id
// @access  Admin
const updateParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const updatedParticipant = await Participant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json(updatedParticipant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete participant
// @route   DELETE /api/participants/:id
// @access  Admin
const deleteParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findByIdAndDelete(id);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (participant.teamId) {
      await Team.findByIdAndUpdate(participant.teamId, {
        $pull: { participantIds: participant._id },
      });
    }

    if (participant.groupId) {
      await Group.findByIdAndUpdate(participant.groupId, {
        $pull: { participantIds: participant._id },
      });
    }

    res.json({ message: "Participant removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getParticipants,
  getParticipantById,
  getParticipantPhoto,
  createParticipant,
  updateParticipant,
  deleteParticipant,
};
