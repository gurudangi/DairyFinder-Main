const Reservation = require("./reservation.model");
const Vendor = require("../vendors/vendor.model");
const ApiError = require("../../utils/ApiError");
const { RESERVATION_DURATION_MS } = require("../../constants/app.constants");

async function createReservation(vendorId, productId, quantity) {
  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      products: { $elemMatch: { id: Number(productId), quantity: { $gte: quantity } } }
    },
    { $inc: { "products.$.quantity": -quantity } },
    { new: true }
  );
  if (!vendor) {
    const exists = await Vendor.exists({ _id: vendorId });
    throw new ApiError(exists ? 400 : 404, exists ? "Not enough stock available." : "Vendor not found.");
  }
  const product = vendor.products.find((item) => item.id === Number(productId));
  if (!product) throw new ApiError(404, "Product not found.");
  const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);
  try {
    return await Reservation.create({
      id: `RES-${Date.now()}`,
      vendorId: vendor.id,
      dairyId: vendor.id,
      dairy: vendor.name,
      productId: product.id,
      product: product.name,
      quantity,
      unit: product.unit,
      price: product.price,
      totalPrice: quantity * product.price,
      expiresAt
    });
  } catch (error) {
    await Vendor.updateOne({ _id: vendorId, "products.id": Number(productId) }, { $inc: { "products.$.quantity": quantity } });
    throw error;
  }
}

module.exports = { createReservation };
