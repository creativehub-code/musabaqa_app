const Setting = require("../models/Setting");

// @desc    Get the current settings (or create defaults if none exist)
// @route   GET /api/settings
// @access  Admin
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        firstPlacePoints: 5,
        secondPlacePoints: 3,
        thirdPlacePoints: 1,
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update the current settings
// @route   PUT /api/settings
// @access  Admin
const updateSettings = async (req, res) => {
  try {
    const { firstPlacePoints, secondPlacePoints, thirdPlacePoints } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        firstPlacePoints,
        secondPlacePoints,
        thirdPlacePoints,
      });
    } else {
      settings.firstPlacePoints =
        firstPlacePoints !== undefined
          ? firstPlacePoints
          : settings.firstPlacePoints;
      settings.secondPlacePoints =
        secondPlacePoints !== undefined
          ? secondPlacePoints
          : settings.secondPlacePoints;
      settings.thirdPlacePoints =
        thirdPlacePoints !== undefined
          ? thirdPlacePoints
          : settings.thirdPlacePoints;
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
