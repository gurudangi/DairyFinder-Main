const ApiError = require("../../utils/ApiError");

const reasons = new Set([
  "not_available_today",
  "owner_out_of_stock",
  "not_sold",
  "price_incorrect",
  "other"
]);

function parseReport(body) {
  const reason = String(body.reason || "");
  const notes = String(body.notes || "").trim();
  if (!reasons.has(reason)) throw new ApiError(400, "A valid report reason is required.");
  if (notes.length > 500) throw new ApiError(400, "Notes must be 500 characters or fewer.");
  return { reason, notes: notes || undefined };
}

module.exports = { parseReport };
