require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGO_URI;

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const collection = mongoose.connection.db.collection("judgemarks");

    console.log("Current Indexes on judgemarks:");
    const indexes = await collection.indexes();
    console.log(indexes);

    for (let index of indexes) {
      if (index.name !== "_id_") {
        console.log(`Dropping index: ${index.name}`);
        await collection.dropIndex(index.name);
      }
    }
    console.log("Cleared all custom indexes from judgemarks.");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
