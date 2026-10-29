const Vendor = require("./vendor.model");
const ApiError = require("../../utils/ApiError");
const { getAvailability } = require("../reports/report.service");

function distanceInKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function listVendors() {
  const vendors = await Vendor.find().sort({ name: 1 }).lean();
  return vendors.map((vendor) => ({ ...vendor, id: vendor._id.toString() }));
}

async function listNearbyVendors(latitude, longitude, maxDistanceKm = 2) {
  const vendors = await listVendors();
  return vendors
    .map((vendor) => {
      const distance = distanceInKm(latitude, longitude, vendor.latitude, vendor.longitude);
      return { ...vendor, distanceValue: distance, distance: `${distance.toFixed(1)} km` };
    })
    .filter((vendor) => vendor.distanceValue <= maxDistanceKm)
    .sort((a, b) => a.distanceValue - b.distanceValue);
}

async function getVendor(id) {
  const vendor = await Vendor.findById(id).lean();
  if (!vendor) throw new ApiError(404, "Vendor not found.");
  return { ...vendor, id: vendor._id.toString() };
}

async function updateStock(vendorId, productId, quantity) {
  const vendor = await Vendor.findOneAndUpdate(
    { _id: vendorId, "products.id": productId },
    { $inc: { "products.$.quantity": quantity } },
    { new: true, lean: true }
  );
  if (!vendor) throw new ApiError(404, "Vendor or product not found.");
  return vendor.products.find((product) => product.id === productId);
}

async function listProducts(vendorId) {
  const vendor = await getVendor(vendorId);
  return Promise.all(vendor.products.map(async (product) => ({
    ...product,
    availability: await getAvailability(vendorId, product.id)
  })));
}

module.exports = { listVendors, listNearbyVendors, getVendor, listProducts, updateStock };
