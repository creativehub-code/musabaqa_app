const mongoose = require("mongoose");

const judgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    judgeGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JudgeGroup",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Judge", judgeSchema);
