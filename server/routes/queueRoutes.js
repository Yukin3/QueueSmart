const express = require("express");
const {getQueue, joinQueue, leaveQueue, serveNext, removeUserFromQueue, reorderQueue, getWaitTime, getServiceWaitTime, getCurrentUserQueues, getUserHistory, } = require("../controllers/queueController");



const router = express.Router();

router.get("/users/:userId/current", getCurrentUserQueues);
router.get("/users/:userId/history", getUserHistory);
router.get("/:serviceId/wait-time", getServiceWaitTime);
router.get("/:serviceId/wait-time/:userId", getWaitTime);
router.get("/:serviceId", getQueue);
router.post("/:serviceId/join", joinQueue);
router.post("/:serviceId/leave", leaveQueue);
router.post("/:serviceId/serve-next", serveNext);
router.delete("/:serviceId/users/:userId", removeUserFromQueue);
router.patch("/:serviceId/reorder", reorderQueue);





module.exports = router;