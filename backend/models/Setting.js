const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    firstPlacePoints: {
      type: Number,
      default: 5,
    },
    secondPlacePoints: {
      type: Number,
      default: 3,
    },
    thirdPlacePoints: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Setting", settingSchema);
