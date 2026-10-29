const cors = require("cors");
const { clientOrigin } = require("./env");

const configuredOrigins = clientOrigin.split(",").map((origin) => origin.trim());
const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

module.exports = cors({
  origin: [...new Set([...configuredOrigins, ...developmentOrigins])],
  credentials: true
});
