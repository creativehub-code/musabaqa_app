const Admin = require("../models/Admin");
const Judge = require("../models/Judge");
const { signToken } = require("../utils/authUtils");

const login = async (req, res) => {
  let { email, password } = req.body;
  // Support both email and username fields, trim and lowercase for consistency
  const identifier = email ? email.trim().toLowerCase() : "";
  if (password) password = password.trim();

  try {
    // 1. Admin Check (Database) - by email
    // We must use .select("+password") because we set select: false in the model
    const admin = await Admin.findOne({ email: identifier }).select("+password");
    
    if (admin && (await admin.matchPassword(password))) {
      // Record login time
      admin.lastLogin = new Date();
      await admin.save();
      
      const token = signToken(admin._id, admin.role);
      return res.json({
        token,
        role: admin.role,
        user: { email: admin.email, name: admin.name, lastLogin: admin.lastLogin },
      });
    }

    // 2. Judge Check - try email first, then username
    let judge = await Judge.findOne({ email: identifier }).select("+password").populate("judgeGroupId");
    
    if (!judge) {
      judge = await Judge.findOne({ username: identifier }).select("+password").populate("judgeGroupId");
    }

    if (judge && (await judge.matchPassword(password))) {
      // Record login time
      judge.lastLogin = new Date();
      await judge.save();

      const token = signToken(judge._id, judge.role);
      return res.json({
        token,
        role: judge.role,
        user: {
          _id: judge._id,
          email: judge.email || null,
          username: judge.username || null,
          name: judge.name,
          category: judge.category || null,
          lastLogin: judge.lastLogin,
          assignedPrograms: judge.judgeGroupId
            ? judge.judgeGroupId.assignedPrograms
            : [],
          judgeGroupId: judge.judgeGroupId ? judge.judgeGroupId._id : null,
        },
      });
    }

    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const setup = async (req, res) => {
  // 1. ENVIRONMENT VARIABLE LOCK: Prevent unauthorized setup even if database is empty
  if (process.env.ALLOW_INITIAL_SETUP !== "true") {
    return res.status(403).json({
      message: "Setup route is permanently disabled for security reasons.",
    });
  }

  try {
    // 2. DATABASE CHECK: Disable setup if any admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ message: "Setup already completed. Admin exists." });
    }

    let { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    
    email = email.trim().toLowerCase();
    password = password.trim();
    
    const admin = await Admin.create({ name, email, password });

    res.status(201).json({ 
        message: "Admin created successfully", 
        admin: { name: admin.name, email: admin.email } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    res.json({ role: req.user.role, user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const logout = (req, res) => {
  res.json({ message: "Logged out successfully. Please clear the token from the client-side." });
};

module.exports = { login, setup, getMe, logout };
