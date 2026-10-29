const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), jwtSecret);
    } catch {
      // Public reporting remains available when an optional token is stale.
    }
  }
  next();
}

module.exports = optionalAuth;
