const express = require("express");


const { loginUser, registerUser } = require("../controllers/authController"); //import auth controller

const router = express.Router();

router.post("/login", loginUser); //handle post req
router.post("/register", registerUser);

module.exports = router;