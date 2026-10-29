const ApiError = require("../../utils/ApiError");

function credentials(body) {
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) throw new ApiError(400, "Username and password are required.");
  return { username, password };
}

module.exports = { credentials };
