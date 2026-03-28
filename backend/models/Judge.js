const mongoose = require("mongoose");

const judgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // allow existing judges without username
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      enum: ["Malayalam", "Arabic", "Urdu", "English"],
    },
    password: {
      type: String,
      required: true,
    },
    judgeGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JudgeGroup",
    },
    role: {
      type: String,
      enum: ["admin", "judge"],
      default: "judge",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Judge", judgeSchema);
