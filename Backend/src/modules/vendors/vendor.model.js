const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  price: { type: Number, required: false, min: 0 },
  availabilityStatus: {
    type: String,
    enum: ["unknown", "owner_confirmed", "customer_likely", "customer_reported_unavailable"],
    default: "unknown"
  },
  availabilitySource: { type: String, enum: ["owner", "customer", "system", "unknown"], default: "unknown" },
  availabilityUpdatedAt: { type: Date },
  customerReportCount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  area: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  products: { type: [productSchema], default: [] }
}, { timestamps: true });

vendorSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
