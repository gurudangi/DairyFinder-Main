const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  dairyId: String,
  dairy: { type: String, required: true },
  productId: Number,
  product: String,
  quantity: Number,
  unit: String,
  price: Number,
  totalPrice: Number,
  status: { type: String, default: "Reserved" },
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);
