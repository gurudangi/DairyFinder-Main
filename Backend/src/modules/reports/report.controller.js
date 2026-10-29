const asyncHandler = require("../../utils/asyncHandler");
const { parseReport } = require("./report.validation");
const { getAvailability, createReport } = require("./report.service");

const availability = asyncHandler(async (req, res) => {
  res.json(await getAvailability(req.params.vendorId, req.params.productId));
});

const submit = asyncHandler(async (req, res) => {
  const result = await createReport(req.params.vendorId, req.params.productId, parseReport(req.body), req);
  res.status(201).json({ success: true, message: "Report submitted for review.", ...result.availability });
});

module.exports = { availability, submit };
