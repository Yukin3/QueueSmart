const express = require("express");
const {getQueue, joinQueue, leaveQueue, serveNext, getWaitTime,} = require("../controllers/queueController");



const router = express.Router();



router.get("/:serviceId", getQueue);
router.post("/:serviceId/join", joinQueue);
router.post("/:serviceId/leave", leaveQueue);
router.post("/:serviceId/serve-next", serveNext);
router.delete("/:serviceId/users/:userId", removeUserFromQueue);
// router.get("/:serviceId/wait-time/:userId", getWaitTime);



module.exports = router;