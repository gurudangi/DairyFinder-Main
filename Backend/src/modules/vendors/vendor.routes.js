const express = require("express");
const controller = require("./vendor.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const router = express.Router();
router.get("/", controller.list);
router.get("/nearby", controller.nearby);
router.get("/:id/products", controller.products);
router.get("/:id/contact", controller.contact);
router.get("/:id", controller.get);
router.post("/", auth, role("admin"), controller.create);
router.post("/:id/stock", auth, role("admin"), controller.stock);

module.exports = router;
