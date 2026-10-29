const asyncHandler = require("../../utils/asyncHandler");
const { login, register } = require("./auth.service");
const { credentials } = require("./auth.validation");

const signIn = asyncHandler(async (req, res) => {
  const { username, password } = credentials(req.body);
  res.json({ success: true, ...(await login(username, password)) });
});

const signUp = asyncHandler(async (req, res) => {
  const { username, password } = credentials(req.body);
  res.status(201).json({ success: true, user: await register(username, password) });
});

module.exports = { signIn, signUp };
