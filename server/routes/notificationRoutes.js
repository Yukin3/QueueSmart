const express = require("express");
const { getUserNotifications } = require("../controllers/notificationController"); //import notifications controller

const router = express.Router();



router.get("/:userId", getUserNotifications); //handle get user notifications



module.exports = router;
