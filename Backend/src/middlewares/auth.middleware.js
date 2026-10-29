const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { jwtSecret } = require("../config/env");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required."));
  }
  try {
    req.user = jwt.verify(header.slice(7), jwtSecret);
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token."));
  }
}

module.exports = authenticate;
