const dns = require("node:dns");
const mongoose = require("mongoose");
const { mongoUri } = require("./env");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDatabase() {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully.");
}

module.exports = { connectDatabase };
