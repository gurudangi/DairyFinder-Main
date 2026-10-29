const express = require("express");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const controller = require("./reservation.controller");

const router = express.Router();
router.post("/", controller.reserve);
router.get("/", auth, role("admin"), controller.list);
module.exports = router;
