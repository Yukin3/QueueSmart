const express = require("express");
const {getQueueHistoryReport, exportQueueHistoryCsv, getQueueStatsReport, exportQueueStatsCsv} = require("../controllers/reportController");

const router = express.Router();


router.get("/queue-history", getQueueHistoryReport);
router.get("/queue-history.csv", exportQueueHistoryCsv);
router.get("/queue-stats", getQueueStatsReport);
router.get("/queue-stats.csv", exportQueueStatsCsv);


module.exports = router;