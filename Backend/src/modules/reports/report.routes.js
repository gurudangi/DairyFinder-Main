const express = require("express");
const auth = require("../../middlewares/auth.middleware");
const reportRateLimit = require("../../middlewares/report-rate-limit.middleware");
const optionalAuth = require("../../middlewares/optional-auth.middleware");
const controller = require("./report.controller");

const router = express.Router();
router.get("/:vendorId/products/:productId/availability", controller.availability);
router.post("/:vendorId/products/:productId/reports", optionalAuth, reportRateLimit, controller.submit);
router.post("/:vendorId/products/:productId/reports-authenticated", auth, reportRateLimit, controller.submit);

module.exports = router;
