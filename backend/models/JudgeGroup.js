const mongoose = require("mongoose");

const judgeGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Judge",
      },
    ],
    assignedPrograms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("JudgeGroup", judgeGroupSchema);
