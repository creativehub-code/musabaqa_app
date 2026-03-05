const Admin = require("../models/Admin");
const Judge = require("../models/Judge");

const login = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim();

  try {
    // 1. Admin Check (Database)
    const admin = await Admin.findOne({ email });
    if (admin && admin.password === password) {
      // Plaintext check for MVP as requested (should be hashed in prod)
      return res.json({
        token: `token-${admin._id}`,
        role: "admin",
        user: { email: admin.email, name: admin.name },
      });
    }

    // 2. Judge Check (Database)
    const judge = await Judge.findOne({ email }).populate("judgeGroupId");
    if (judge && judge.password === password) {
      return res.json({
        token: `token-${judge._id}`,
        role: "judge",
        user: {
          _id: judge._id,
          email: judge.email,
          name: judge.name,
          assignedPrograms: judge.judgeGroupId
            ? judge.judgeGroupId.assignedPrograms
            : [],
          judgeGroupId: judge.judgeGroupId ? judge.judgeGroupId._id : null,
        },
      });
    }

    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
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
    if (email) email = email.trim();
    const admin = await Admin.create({ name, email, password }); // Ideally hash password here

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { login, setup };
