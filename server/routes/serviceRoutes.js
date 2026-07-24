const express = require("express");
const { getServices, createService, updateService, getServiceById, deleteService } = require("../controllers/serviceController"); //import services controller

const router = express.Router();



router.get("/", getServices); //handle get req
router.get("/:serviceId", getServiceById);
router.post("/", createService); 
router.patch("/:serviceId", updateService);
router.delete("/:serviceId", deleteService);


module.exports = router;