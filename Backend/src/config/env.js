const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const required = ["MONGODB_URI", "JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  port: Number(process.env.PORT || 5001),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  availabilityFreshnessDays: Number(process.env.AVAILABILITY_REPORT_FRESHNESS_DAYS || 7),
  reportRateLimitWindowMs: Number(process.env.REPORT_RATE_LIMIT_WINDOW_MS || 900000),
  reportRateLimitMax: Number(process.env.REPORT_RATE_LIMIT_MAX || 10)
};
