const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

// Hash password before saving (only if modified)
judgeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Securely compare entered password with hashed password in DB
judgeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Judge", judgeSchema);
