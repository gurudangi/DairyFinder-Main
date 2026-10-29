const express = require("express");
const auth = require("../../middlewares/auth.middleware");
const controller = require("./user.controller");

const router = express.Router();
router.get("/me", auth, controller.me);
module.exports = router;
