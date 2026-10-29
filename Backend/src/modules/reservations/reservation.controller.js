const asyncHandler = require("../../utils/asyncHandler");
const Reservation = require("./reservation.model");
const { createReservation } = require("./reservation.service");
const ApiError = require("../../utils/ApiError");

const reserve = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, "Quantity must be at least 1.");
  const reservation = await createReservation(req.body.vendorId || req.body.dairyId, req.body.productId, quantity);
  res.status(201).json({ success: true, ...reservation.toObject(), message: "Reservation confirmed! Valid for 10 minutes." });
});

const list = asyncHandler(async (req, res) => res.json(await Reservation.find().sort({ createdAt: -1 }).lean()));

module.exports = { reserve, list };
