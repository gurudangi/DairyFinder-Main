const express = require("express");
const controller = require("./auth.controller");

const router = express.Router();
router.post("/login", controller.signIn);
router.post("/register", controller.signUp);
module.exports = router;
