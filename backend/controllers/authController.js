// Hardcoded Demo Auth + DB Auth for Judges
const Judge = require("../models/Judge");

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Admin Check (Hardcoded for MVP)
    if (email === "admin@fest.com" && password === "admin123") {
      return res.json({
        token: "demo-admin-token",
        role: "admin",
        user: { email, name: "Admin" },
      });
    }

    // 2. Judge Check (Database)
    const judge = await Judge.findOne({ email });
    if (judge && judge.password === password) {
      // Plaintext check for MVP
      return res.json({
        token: `token-${judge._id}`,
        role: "judge",
        user: {
          _id: judge._id,
          email: judge.email,
          name: judge.name,
          assignedPrograms: judge.assignedPrograms,
        },
      });
    }

    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login };
