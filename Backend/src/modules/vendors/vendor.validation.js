const ApiError = require("../../utils/ApiError");

function parseCoordinates(query) {
  const latitude = Number(query.lat);
  const longitude = Number(query.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(400, "Valid latitude and longitude are required.");
  }
  return { latitude, longitude };
}

function parseStock(body) {
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1.");
  }
  return { vendorId: body.vendorId || body.dairyId, productId: Number(body.productId), quantity };
}

module.exports = { parseCoordinates, parseStock };
