const crypto = require("node:crypto");
const Report = require("./report.model");
const Vendor = require("../vendors/vendor.model");
const ApiError = require("../../utils/ApiError");
const { availabilityFreshnessDays } = require("../../config/env");

function fingerprint(req) {
  return crypto.createHash("sha256")
    .update(`${req.ip || ""}|${req.get("user-agent") || ""}`)
    .digest("hex");
}

async function getAvailability(vendorId, productId) {
  const vendor = await Vendor.findById(vendorId).lean();
  if (!vendor) throw new ApiError(404, "Dairy not found.");
  const product = vendor.products.find((item) => item.id === Number(productId));
  if (!product) throw new ApiError(404, "Product not found.");
  const cutoff = new Date(Date.now() - availabilityFreshnessDays * 86400000);
  const reports = await Report.find({
    vendorId,
    productId: Number(productId),
    reason: { $ne: "price_incorrect" },
    createdAt: { $gte: cutoff }
  })
    .sort({ createdAt: -1 }).lean();
  const reportCount = reports.length;
  const latestReport = reports[0] || null;
  const status = product.availabilityStatus === "owner_confirmed" &&
    product.availabilityUpdatedAt && new Date(product.availabilityUpdatedAt) >= cutoff
    ? "owner_confirmed"
    : reportCount > 0
      ? "customer_reported_unavailable"
      : "unknown";
  return {
    status,
    source: status === "owner_confirmed" ? "owner" : status === "customer_reported_unavailable" ? "customer" : "unknown",
    updatedAt: status === "owner_confirmed" ? product.availabilityUpdatedAt : latestReport?.createdAt || null,
    reportCount,
    latestReportAt: latestReport?.createdAt || null
  };
}

async function createReport(vendorId, productId, input, req) {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, "Dairy not found.");
  const product = vendor.products.find((item) => item.id === Number(productId));
  if (!product) throw new ApiError(404, "Product not found.");
  const reporterFingerprint = fingerprint(req);
  const duplicateSince = new Date(Date.now() - 86400000);
  const duplicate = await Report.exists({
    vendorId, productId: Number(productId), reporterFingerprint, createdAt: { $gte: duplicateSince }
  });
  if (duplicate) throw new ApiError(409, "You have already reported this product recently.");
  const report = await Report.create({
    vendorId, productId: Number(productId), ...input,
    reporterUserId: req.user?.userId, reporterFingerprint
  });
  return { report, availability: await getAvailability(vendorId, productId) };
}

module.exports = { getAvailability, createReport };
