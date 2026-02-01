const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for debugging
    credentials: false, // Must be false when origin is "*"
  }),
);
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/participants", require("./routes/participantRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/programs", require("./routes/programRoutes"));
app.use("/api/marks", require("./routes/markRoutes"));
app.use("/api/judges", require("./routes/judgeRoutes"));

// Basic Route
app.get("/", (req, res) => {
  res.send("Art Festival API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
