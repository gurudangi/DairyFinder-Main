const mongoose = require("mongoose");
const { connectDatabase } = require("./config/database");
const Vendor = require("./modules/vendors/vendor.model");

const products = (prefix) => [
  { id: prefix + 1, name: "Cow Milk", quantity: 0, unit: "1 L", price: 60 },
  { id: prefix + 2, name: "Paneer", quantity: 0, unit: "200 g", price: 80 },
  { id: prefix + 3, name: "Curd", quantity: 0, unit: "500 g", price: 40 },
  { id: prefix + 4, name: "Ghee", quantity: 0, unit: "500 g", price: 450 }
];

const seedVendors = [
  {
    name: "Shree Dairy",
    latitude: 22.7196,
    longitude: 75.8577,
    area: "Palasia",
    address: "56 Scheme 78, Near Bombay Hospital, Indore",
    phone: "919876543210",
    products: products(100)
  },
  {
    name: "Gupta Dairy",
    latitude: 22.728,
    longitude: 75.864,
    area: "Vijay Nagar",
    address: "Vijay Nagar, Indore",
    phone: "919876543211",
    products: products(200)
  },
  {
    name: "A1 Milk Point",
    latitude: 22.711,
    longitude: 75.849,
    area: "Bengali Square",
    address: "Bengali Square, Indore",
    phone: "919876543212",
    products: products(300)
  },
  {
    name: "Sharma Dairy",
    latitude: 22.704,
    longitude: 75.873,
    area: "Rau",
    address: "Main Market, Rau, Indore",
    phone: "919876543213",
    products: products(400)
  }
];

async function seed() {
  await connectDatabase();
  for (const vendor of seedVendors) {
    await Vendor.updateOne(
      { name: vendor.name },
      { $setOnInsert: vendor },
      { upsert: true }
    );
  }
  console.log(`Seed complete: ${seedVendors.length} development dairies available.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
