const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "vendor"], default: "vendor" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
