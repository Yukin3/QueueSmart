const express = require("express");


const { loginUser } = require("../controllers/authController"); //import auth controller

const router = express.Router();

router.post("/login", loginUser); //handle post req
router.post("/register", register);

module.exports = router;