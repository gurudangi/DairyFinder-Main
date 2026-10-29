const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function generateToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "2h" });
}

module.exports = generateToken;
