const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const vendorRoutes = require("../modules/vendors/vendor.routes");
const reservationRoutes = require("../modules/reservations/reservation.routes");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const vendorController = require("../modules/vendors/vendor.controller");
const authController = require("../modules/auth/auth.controller");
const reservationController = require("../modules/reservations/reservation.controller");
const reportRoutes = require("../modules/reports/report.routes");

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/vendors", vendorRoutes);
router.use("/reservations", reservationRoutes);
router.use("/reports", reportRoutes);

// Compatibility routes for the existing client while it migrates to vendor naming.
router.use("/dairies", vendorRoutes);
router.use("/dairies", reportRoutes);
router.post("/stock/update", auth, role("admin"), vendorController.stock);
router.post("/reserve", reservationController.reserve);
router.post("/admin/login", authController.signIn);

module.exports = router;
