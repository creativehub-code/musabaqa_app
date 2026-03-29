const Admin = require("../models/Admin");
const Judge = require("../models/Judge");
const { signToken } = require("../utils/authUtils");

const login = async (req, res) => {
  let { email, password } = req.body;
  // Support both email and username fields, trim and lowercase for consistency
  const identifier = email ? email.trim().toLowerCase() : "";
  if (password) password = password.trim();

  try {
    // 1. Admin Check (Database) - by email (case-insensitive)
    const admin = await Admin.findOne({ 
      email: { $regex: new RegExp(`^${identifier}$`, "i") } 
    });
    if (admin && (await admin.matchPassword(password))) {
      const token = signToken(admin._id, admin.role);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      return res.json({
        role: admin.role,
        user: { email: admin.email, name: admin.name },
      });
    }

    // 2. Judge Check - try email first, then username
    let judge = await Judge.findOne({ 
      email: { $regex: new RegExp(`^${identifier}$`, "i") } 
    }).populate("judgeGroupId");
    
    if (!judge) {
      judge = await Judge.findOne({ 
        username: { $regex: new RegExp(`^${identifier}$`, "i") } 
      }).populate("judgeGroupId");
    }

    if (judge && (await judge.matchPassword(password))) {
      const token = signToken(judge._id, judge.role);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      return res.json({
        role: judge.role,
        user: {
          _id: judge._id,
          email: judge.email || null,
          username: judge.username || null,
          name: judge.name,
          category: judge.category || null,
          assignedPrograms: judge.judgeGroupId
            ? judge.judgeGroupId.assignedPrograms
            : [],
          judgeGroupId: judge.judgeGroupId ? judge.judgeGroupId._id : null,
        },
      });
    }

    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    require('fs').writeFileSync('tmp_login_error.txt', error.stack || error.message);
    res.status(500).json({ message: error.message });
  }
};

const setup = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res
        .status(403)
        .json({ message: "Setup already completed. Admin exists." });
    }

    let { name, email, password } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (password) password = password.trim();
    const admin = await Admin.create({ name, email, password });

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    res.json({ role: req.user.role, user: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

module.exports = { login, setup, getMe, logout };
