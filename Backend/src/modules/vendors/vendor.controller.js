const Vendor = require("./vendor.model");
const asyncHandler = require("../../utils/asyncHandler");
const { listVendors, listNearbyVendors, getVendor, listProducts, updateStock } = require("./vendor.service");
const { parseCoordinates, parseStock } = require("./vendor.validation");

const list = asyncHandler(async (req, res) => res.json(await listVendors()));
const nearby = asyncHandler(async (req, res) => {
  const { latitude, longitude } = parseCoordinates(req.query);
  res.json(await listNearbyVendors(latitude, longitude));
});
const get = asyncHandler(async (req, res) => res.json(await getVendor(req.params.id)));
const products = asyncHandler(async (req, res) => res.json(await listProducts(req.params.id)));
const contact = asyncHandler(async (req, res) => {
  const vendor = await getVendor(req.params.id);
  res.json({ name: vendor.name, phone: vendor.phone || null });
});
const create = asyncHandler(async (req, res) => res.status(201).json(await Vendor.create(req.body)));
const stock = asyncHandler(async (req, res) => {
  const { vendorId, productId, quantity } = parseStock(req.body);
  const product = await updateStock(vendorId, productId, quantity);
  res.json({ success: true, ...product, message: "Stock updated successfully." });
});

module.exports = { list, nearby, get, products, contact, create, stock };
