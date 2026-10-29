const { reportRateLimitWindowMs, reportRateLimitMax } = require("../config/env");

const attempts = new Map();

function reportRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || "unknown";
  const recent = (attempts.get(key) || []).filter((time) => now - time < reportRateLimitWindowMs);
  if (recent.length >= reportRateLimitMax) {
    return res.status(429).json({ success: false, message: "Too many reports. Please try again later." });
  }
  recent.push(now);
  attempts.set(key, recent);
  return next();
}

module.exports = reportRateLimit;
