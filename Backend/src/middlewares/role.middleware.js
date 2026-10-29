const ApiError = require("../utils/ApiError");

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return next(new ApiError(403, "Access denied."));
    return next();
  };
}

module.exports = requireRole;
