const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  productId: { type: Number, required: true },
  reason: {
    type: String,
    enum: ["not_available_today", "owner_out_of_stock", "not_sold", "price_incorrect", "other"],
    required: true
  },
  notes: { type: String, trim: true, maxlength: 500 },
  reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reporterFingerprint: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

reportSchema.index({ vendorId: 1, productId: 1, reporterFingerprint: 1, createdAt: -1 });
reportSchema.index({ vendorId: 1, productId: 1, createdAt: -1 });

module.exports = mongoose.model("AvailabilityReport", reportSchema);
