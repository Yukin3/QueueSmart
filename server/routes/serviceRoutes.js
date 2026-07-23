const express = require("express");
const { getServices } = require("../controllers/serviceController"); //import services controller

const router = express.Router();



router.get("/", getServices); //handle get req




module.exports = router;