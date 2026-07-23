const express = require("express");
const { getServices, createService, updateService } = require("../controllers/serviceController"); //import services controller

const router = express.Router();



router.get("/", getServices); //handle get req
router.post("/", createService); 
router.patch("/:serviceId", updateService);



module.exports = router;