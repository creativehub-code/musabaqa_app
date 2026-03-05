const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();
const Judge = require("./models/Judge");

mongoose
  .connect(process.env.MONGO_URI.trim())
  .then(async () => {
    const judges = await Judge.find().sort({ createdAt: -1 }).limit(5);
    fs.writeFileSync("test_output.json", JSON.stringify(judges, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
