const express = require("express");
const { getServices, createService } = require("../controllers/serviceController"); //import services controller

const router = express.Router();



router.get("/", getServices); //handle get req
router.post("/", createService); 



module.exports = router;