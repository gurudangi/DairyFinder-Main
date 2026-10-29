const bcrypt = require("bcryptjs");
const User = require("./auth.model");
const ApiError = require("../../utils/ApiError");
const generateToken = require("../../utils/generateToken");
const { adminUsername, adminPassword } = require("../../config/env");

async function login(username, password) {
  if (username === adminUsername && password === adminPassword) {
    return { token: generateToken({ username, role: "admin" }) };
  }
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid username or password.");
  }
  return { token: generateToken({ userId: user.id, username: user.username, role: user.role }) };
}

async function register(username, password) {
  if (!username || !password || password.length < 8) {
    throw new ApiError(400, "Username and a password of at least 8 characters are required.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ username, passwordHash });
    return { id: user.id, username: user.username, role: user.role };
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "Username is already registered.");
    throw error;
  }
}

module.exports = { login, register };
