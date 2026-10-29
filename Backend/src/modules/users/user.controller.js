const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { getById } = require("./user.service");

const me = asyncHandler(async (req, res) => {
  if (!req.user.userId) throw new ApiError(404, "Admin accounts are configured through environment variables.");
  res.json(await getById(req.user.userId));
});

module.exports = { me };
