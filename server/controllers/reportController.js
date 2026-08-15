const QueueHistory = require("../models/QueueHistory");
const Service = require("../models/Service");
const QueueEntry = require("../models/QueueEntry");


//format output csv
function csvEscape(value) {
  if (value === null || value === undefined) return "";
  
  const stringValue = String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
}


//build final csv
function buildCsv(headers, rows) {
  return [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}



//admin helpers

//get services owned by current admin
async function getAdminServices(adminId) {
  if (!adminId) {
    return [];
  }

  return Service.find({ adminId }).sort({ name: 1 });
}


//get service IDs owned by current admin
async function getAdminServiceIds(adminId) {
  const services = await getAdminServices(adminId);
  return services.map((service) => service._id.toString());
}




//filter history report
async function applyHistoryFilters(query) {
  const { adminId, serviceId, outcome, userId, startDate, endDate } = query;
  const adminServiceIds = await getAdminServiceIds(adminId);
  const filter = {};

  //handle admin w/ no services
  if (adminServiceIds.length === 0) {
    filter.serviceId = { $in: [] };
    return filter;
  }


  
  //confirm owner of service
  if (serviceId) {
    if (!adminServiceIds.includes(serviceId)) {
      filter.serviceId = { $in: [] };
    } else {
      filter.serviceId = serviceId;
    }
  } else {
    filter.serviceId = { $in: adminServiceIds };
  }
  if (outcome) filter.outcome = outcome;
  if (userId) filter.userId = userId;


  if (startDate || endDate) {
    filter.endedAt = {};


    if (startDate) {
      filter.endedAt.$gte = new Date(startDate);
    }


    if (endDate) {
      filter.endedAt.$lte = new Date(endDate);
    }
  }

  return filter;
}


//queue history json return
async function getQueueHistoryReport(req, res) {
  try {
    const { adminId } = req.query;


    if (!adminId) {
        return res.status(400).json({
            error: "adminId is required to generate reports.",
        });
    }


    const filter = await applyHistoryFilters(req.query);
    const history = await QueueHistory.find(filter).sort({ endedAt: -1 }); //filter hustory records



    //return req. fields in json
    return res.json({
      generatedAt: new Date(),
      adminId,
      count: history.length,
      report: history.map((record) => ({
        historyId: record.historyId,
        userId: record.userId,
        userName: record.userName,
        serviceId: record.serviceId,
        serviceName: record.serviceName,
        outcome: record.outcome,
        type: record.type,
        priority: record.priority,
        joinedAt: record.joinedAt,
        endedAt: record.endedAt,
        waitDurationMinutes: record.waitDurationMinutes,
      })),
    });


  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate queue history report.",
      details: error.message,
    });

  }
}


//export history report as csv
async function exportQueueHistoryCsv(req, res) {
  try {
    const { adminId } = req.query;

    if (!adminId) {
        return res.status(400).json({
            error: "adminId is required to generate reports.",
        });
    }

    const filter = await applyHistoryFilters(req.query);
    const history = await QueueHistory.find(filter).sort({ endedAt: -1 });



    //csv columns
    const headers = [
      "historyId",
      "userId",
      "userName",
      "serviceId",
      "serviceName",
      "outcome",
      "type",
      "priority",
      "joinedAt",
      "endedAt",
      "waitDurationMinutes",
    ];


    //map history data etry to csv row
    const rows = history.map((record) => [
      record.historyId,
      record.userId,
      record.userName,
      record.serviceId,
      record.serviceName,
      record.outcome,
      record.type,
      record.priority,
      record.joinedAt,
      record.endedAt,
      record.waitDurationMinutes,
    ]);



    const csv = buildCsv(headers, rows);


    //set donwload type
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=queue-history.csv"
    );


    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to export queue history report.",
      details: error.message,
    });

  }
}



//build queue stats summary (for json +csv)
async function buildQueueStatsReport(adminId, serviceId) {
    let services = await getAdminServices(adminId);

    if (serviceId) {
        services = services.filter((service) => service._id.toString() === serviceId);
    }

  const report = [];


  //calculate stats for each service
  for (const service of services) {
    const serviceId = service._id.toString();


    //#ppl actively waiitng
    const activeCount = await QueueEntry.countDocuments({
      serviceId,
      status: "waiting",
    });


    //# ppl served
    const servedCount = await QueueHistory.countDocuments({
      serviceId,
      outcome: "served",
    });



    //#ppl lefy
    const leftCount = await QueueHistory.countDocuments({
      serviceId,
      outcome: "left",
    });


    //#users removed from queue
    const removedCount = await QueueHistory.countDocuments({
      serviceId,
      outcome: "removed",
    });


    const completedHistory = await QueueHistory.find({ serviceId });



    const averageWait =
      completedHistory.length === 0
        ? 0
        : Math.round(
            completedHistory.reduce(
              (sum, record) => sum + record.waitDurationMinutes,
              0
            ) / completedHistory.length
          );


    //add calculated stats for service to report
    report.push({
      serviceId,
      serviceName: service.name,
      adminId: service.adminId,
      isOpen: service.isOpen,
      expectedDuration: service.expectedDuration,
      activeWaiting: activeCount,
      servedCount,
      leftCount,
      removedCount,
      totalCompleted: completedHistory.length,
      averageWaitDurationMinutes: averageWait,
    });
  }


  return report;
}




//json return stats report for all services
async function getQueueStatsReport(req, res) {
  try {
    const { adminId } = req.query;

    if (!adminId) {
        return res.status(400).json({
            error: "adminId is required to generate reports.",
        });
    }


    const report = await buildQueueStatsReport(adminId, req.query.serviceId);



    return res.json({
        generatedAt: new Date(),
        adminId,
        count: report.length,
        report,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate statistics report.",
      details: error.message,
    });

  }
}



//export summary stats report as csv 
async function exportQueueStatsCsv(req, res) {
  try {
    const { adminId } = req.query;


    if (!adminId) {
        return res.status(400).json({
            error: "adminId is required to export reports.",
        });
    }


    const report = await buildQueueStatsReport(adminId, req.query.serviceId);

     //csv columns
    const headers = [
      "serviceId",
      "serviceName",
      "adminId",
      "isOpen",
      "expectedDuration",
      "activeWaiting",
      "servedCount",
      "leftCount",
      "removedCount",
      "totalCompleted",
      "averageWaitDurationMinutes",
    ];


     //map service stats data to csv row
    const rows = report.map((record) => [
      record.serviceId,
      record.serviceName,
      record.adminId,
      record.isOpen,
      record.expectedDuration,
      record.activeWaiting,
      record.servedCount,
      record.leftCount,
      record.removedCount,
      record.totalCompleted,
      record.averageWaitDurationMinutes,
    ]);

    const csv = buildCsv(headers, rows);


    //set donwload type
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=queue-statistics.csv"
    );

    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to export statistics report.",
      details: error.message,
    });
  }
}


module.exports = {getQueueHistoryReport, exportQueueHistoryCsv, getQueueStatsReport, exportQueueStatsCsv, };