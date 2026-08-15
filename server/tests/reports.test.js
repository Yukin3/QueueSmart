const request = require("supertest");
const app = require("../app"); //import express app
const Service = require("../models/Service");
const QueueEntry = require("../models/QueueEntry");
const QueueHistory = require("../models/QueueHistory");


//dedicated admins so the report totals cannot be changed by the other test suites
const REPORT_ADMIN = "admin-report-test";
const OTHER_ADMIN = "admin-report-other";

//every record this suite creates is prefixed so it can be cleaned up again
const USER_PREFIX = "report-user";
const CLEANUP_PATTERN = "^report-";

let advisingService;   //open service, carries most of the recorded activity
let helpDeskService;   //closed service, one removed participation
let otherAdminService; //belongs to a different admin, must stay out of the reports


//helper: remove everything this suite creates
async function clearReportData() {
  await Service.deleteMany({ adminId: { $in: [REPORT_ADMIN, OTHER_ADMIN] } });
  await QueueEntry.deleteMany({ userId: { $regex: CLEANUP_PATTERN } });
  await QueueHistory.deleteMany({ userId: { $regex: CLEANUP_PATTERN } });
}


//helper: build one completed participation record
function historyRecord({ id, userId, userName, service, outcome, endedAt, waitDurationMinutes, type = "walk-in", priority = "normal" }) {
  return {
    historyId: id,
    entryId: `${id}-entry`,
    userId,
    userName,
    serviceId: service._id.toString(),
    serviceName: service.name,
    outcome,
    type,
    priority,
    joinedAt: new Date(new Date(endedAt).getTime() - waitDurationMinutes * 60000),
    endedAt: new Date(endedAt),
    waitDurationMinutes,
  };
}


//helper: request a report as a given admin
function getReport(path, adminId) {
  const url = adminId === undefined ? path : `${path}${path.includes("?") ? "&" : "?"}adminId=${adminId}`;

  return request(app).get(url);
}




//like the other suites, the cleanup runs up front rather than in afterAll
//the shared connection is already closed by tests/setup.js before an afterAll here could use it
beforeAll(async () => {
  await clearReportData(); //start from a known state even if an earlier run was interrupted

  advisingService = await Service.create({
    organizationId: "org-uh",
    adminId: REPORT_ADMIN,
    name: "Report Test Advising",
    description: "Advising service used by the reporting tests.",
    expectedDuration: 30,
    priority: "high",
    isOpen: true,
  });


  helpDeskService = await Service.create({
    organizationId: "org-uh",
    adminId: REPORT_ADMIN,
    name: "Report Test Help Desk",
    description: "Help desk service used by the reporting tests.",
    expectedDuration: 12,
    priority: "low",
    isOpen: false,
  });


  otherAdminService = await Service.create({
    organizationId: "org-uh",
    adminId: OTHER_ADMIN,
    name: "Report Other Admin Service",
    description: "Belongs to another admin and must be excluded from the reports.",
    expectedDuration: 20,
    priority: "medium",
    isOpen: true,
  });


  //*completed participations
  //advising: two served (10 and 20 minutes) and one left (30 minutes) -> average 20
  //help desk: one removed (5 minutes)
  await QueueHistory.create([
    historyRecord({
      id: "report-history-1",
      userId: `${USER_PREFIX}-1`,
      userName: "Report Customer One",
      service: advisingService,
      outcome: "served",
      endedAt: "2026-07-10T12:00:00.000Z",
      waitDurationMinutes: 10,
    }),
    historyRecord({
      id: "report-history-2",
      userId: `${USER_PREFIX}-2`,
      userName: "Report Customer Two",
      service: advisingService,
      outcome: "served",
      endedAt: "2026-07-15T12:00:00.000Z",
      waitDurationMinutes: 20,
      type: "appointment",
      priority: "high",
    }),
    historyRecord({
      id: "report-history-3",
      userId: `${USER_PREFIX}-1`,
      userName: "Report Customer One",
      service: advisingService,
      outcome: "left",
      endedAt: "2026-07-20T12:00:00.000Z",
      waitDurationMinutes: 30,
    }),
    historyRecord({
      id: "report-history-4",
      userId: `${USER_PREFIX}-3`,
      userName: 'Report "Quoted" Customer', //checks the CSV escaping
      service: helpDeskService,
      outcome: "removed",
      endedAt: "2026-07-12T12:00:00.000Z",
      waitDurationMinutes: 5,
    }),
    historyRecord({
      id: "report-history-5",
      userId: `${USER_PREFIX}-4`,
      userName: "Report Other Admin Customer",
      service: otherAdminService,
      outcome: "served",
      endedAt: "2026-07-18T12:00:00.000Z",
      waitDurationMinutes: 99,
    }),
  ]);


  //*live queue activity
  //advising has two people waiting, help desk has one person already being served
  await QueueEntry.create([
    {
      entryId: "report-entry-1",
      serviceId: advisingService._id.toString(),
      userId: `${USER_PREFIX}-5`,
      userName: "Report Waiting One",
      status: "waiting",
    },
    {
      entryId: "report-entry-2",
      serviceId: advisingService._id.toString(),
      userId: `${USER_PREFIX}-6`,
      userName: "Report Waiting Two",
      status: "waiting",
    },
    {
      entryId: "report-entry-3",
      serviceId: helpDeskService._id.toString(),
      userId: `${USER_PREFIX}-7`,
      userName: "Report Serving One",
      status: "serving",
    },
  ]);
});




//group the adminId requirement shared by every report route
describe("Report adminId requirement", () => {

  //the history report cannot be generated without an admin
  test("rejects the history report with no adminId", async () => {
    const response = await request(app).get("/api/reports/queue-history");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("adminId is required to generate reports.");
  });


  //the history CSV export cannot be generated without an admin
  test("rejects the history CSV export with no adminId", async () => {
    const response = await request(app).get("/api/reports/queue-history.csv");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("adminId is required to generate reports.");
  });


  //the statistics report cannot be generated without an admin
  test("rejects the statistics report with no adminId", async () => {
    const response = await request(app).get("/api/reports/queue-stats");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("adminId is required to generate reports.");
  });


  //the statistics CSV export cannot be generated without an admin
  test("rejects the statistics CSV export with no adminId", async () => {
    const response = await request(app).get("/api/reports/queue-stats.csv");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("adminId is required to export reports.");
  });
});




//group the queue history report
describe("Queue history report", () => {

  //the report only covers the requesting admin's own services
  test("returns only the requesting admin's participations", async () => {
    const response = await getReport("/api/reports/queue-history", REPORT_ADMIN);

    expect(response.statusCode).toBe(200);
    expect(response.body.adminId).toBe(REPORT_ADMIN);
    expect(response.body).toHaveProperty("generatedAt");
    expect(response.body.count).toBe(4); //the fifth record belongs to another admin

    const userIds = response.body.report.map((record) => record.userId);

    expect(userIds).not.toContain(`${USER_PREFIX}-4`);
  });


  //each record carries the fields the report screen needs
  test("includes the participation details of each record", async () => {
    const response = await getReport("/api/reports/queue-history", REPORT_ADMIN);

    const record = response.body.report.find((item) => item.historyId === "report-history-2");

    expect(record).toBeDefined();
    expect(record.userId).toBe(`${USER_PREFIX}-2`);
    expect(record.userName).toBe("Report Customer Two");
    expect(record.serviceId).toBe(advisingService._id.toString());
    expect(record.serviceName).toBe("Report Test Advising");
    expect(record.outcome).toBe("served");
    expect(record.type).toBe("appointment");
    expect(record.priority).toBe("high");
    expect(record.waitDurationMinutes).toBe(20);
    expect(record).toHaveProperty("joinedAt");
    expect(record).toHaveProperty("endedAt");
  });


  //the most recent participation is listed first
  test("sorts the records most recent first", async () => {
    const response = await getReport("/api/reports/queue-history", REPORT_ADMIN);

    const endedTimes = response.body.report.map((record) => new Date(record.endedAt).getTime());
    const sortedDescending = [...endedTimes].sort((a, b) => b - a);

    expect(endedTimes).toEqual(sortedDescending);
    expect(response.body.report[0].historyId).toBe("report-history-3"); //July 20
  });


  //a service filter narrows the report to that service
  test("filters the report by service", async () => {
    const response = await getReport(
      `/api/reports/queue-history?serviceId=${helpDeskService._id}`,
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.report[0].serviceName).toBe("Report Test Help Desk");
  });


  //an admin cannot pull the report of a service they do not own
  test("returns nothing for a service the admin does not own", async () => {
    const response = await getReport(
      `/api/reports/queue-history?serviceId=${otherAdminService._id}`,
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.report).toEqual([]);
  });


  //an outcome filter narrows the report
  test("filters the report by outcome", async () => {
    const response = await getReport("/api/reports/queue-history?outcome=served", REPORT_ADMIN);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.report.every((record) => record.outcome === "served")).toBe(true);
  });


  //a user filter narrows the report to one customer
  test("filters the report by user", async () => {
    const response = await getReport(
      `/api/reports/queue-history?userId=${USER_PREFIX}-1`,
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.report.every((record) => record.userId === `${USER_PREFIX}-1`)).toBe(true);
  });


  //a date range narrows the report to participations that ended inside it
  test("filters the report by date range", async () => {
    const response = await getReport(
      "/api/reports/queue-history?startDate=2026-07-14T00:00:00.000Z&endDate=2026-07-21T00:00:00.000Z",
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(2); //July 15 and July 20
    expect(response.body.report.map((record) => record.historyId).sort())
      .toEqual(["report-history-2", "report-history-3"]);
  });


  //a start boundary on its own still filters
  test("filters the report by start date only", async () => {
    const response = await getReport(
      "/api/reports/queue-history?startDate=2026-07-19T00:00:00.000Z",
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.report[0].historyId).toBe("report-history-3");
  });


  //an end boundary on its own still filters
  test("filters the report by end date only", async () => {
    const response = await getReport(
      "/api/reports/queue-history?endDate=2026-07-11T00:00:00.000Z",
      REPORT_ADMIN
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.report[0].historyId).toBe("report-history-1");
  });


  //an admin without services gets an empty report rather than an error
  test("returns an empty report for an admin with no services", async () => {
    const response = await getReport("/api/reports/queue-history", "admin-report-nobody");

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.report).toEqual([]);
  });
});




//group the queue history CSV export
describe("Queue history CSV export", () => {

  //the export is returned as a downloadable CSV file
  test("returns a downloadable CSV file", async () => {
    const response = await getReport("/api/reports/queue-history.csv", REPORT_ADMIN);

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/csv/);
    expect(response.headers["content-disposition"]).toBe("attachment; filename=queue-history.csv");
  });


  //the first line names every exported column
  test("starts with the column header row", async () => {
    const response = await getReport("/api/reports/queue-history.csv", REPORT_ADMIN);

    const [header] = response.text.split("\n");

    expect(header).toBe(
      "historyId,userId,userName,serviceId,serviceName,outcome,type,priority,joinedAt,endedAt,waitDurationMinutes"
    );
  });


  //one row is exported per participation, admin's services only
  test("exports one row per participation", async () => {
    const response = await getReport("/api/reports/queue-history.csv", REPORT_ADMIN);

    const rows = response.text.split("\n");

    expect(rows).toHaveLength(5); //one header row plus four participations
    expect(response.text).toContain('"Report Customer One"');
    expect(response.text).not.toContain("Report Other Admin Customer");
  });


  //a quote inside a value is doubled so the CSV stays valid
  test("escapes quotes inside a value", async () => {
    const response = await getReport("/api/reports/queue-history.csv", REPORT_ADMIN);

    expect(response.text).toContain('"Report ""Quoted"" Customer"');
  });


  //the export honours the same filters as the JSON report
  test("honours the outcome filter", async () => {
    const response = await getReport("/api/reports/queue-history.csv?outcome=removed", REPORT_ADMIN);

    const rows = response.text.split("\n");

    expect(rows).toHaveLength(2); //header plus the single removed participation
    expect(response.text).toContain('"removed"');
  });
});




//group the queue statistics report
describe("Queue statistics report", () => {

  //one summary row is returned per service the admin owns
  test("summarises every service the admin owns", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    expect(response.statusCode).toBe(200);
    expect(response.body.adminId).toBe(REPORT_ADMIN);
    expect(response.body).toHaveProperty("generatedAt");
    expect(response.body.count).toBe(2);
    expect(response.body.report.map((row) => row.serviceName))
      .toEqual(["Report Test Advising", "Report Test Help Desk"]); //sorted by name
  });


  //the service details are reported alongside the activity
  test("reports the service details", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    const [advising, helpDesk] = response.body.report;

    expect(advising.serviceId).toBe(advisingService._id.toString());
    expect(advising.adminId).toBe(REPORT_ADMIN);
    expect(advising.isOpen).toBe(true);
    expect(advising.expectedDuration).toBe(30);

    expect(helpDesk.isOpen).toBe(false);
    expect(helpDesk.expectedDuration).toBe(12);
  });


  //served, left, and removed participations are counted per service
  test("counts the participations by outcome", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    const [advising, helpDesk] = response.body.report;

    expect(advising.servedCount).toBe(2);
    expect(advising.leftCount).toBe(1);
    expect(advising.removedCount).toBe(0);
    expect(advising.totalCompleted).toBe(3);

    expect(helpDesk.servedCount).toBe(0);
    expect(helpDesk.removedCount).toBe(1);
    expect(helpDesk.totalCompleted).toBe(1);
  });


  //the average wait time is the mean of the recorded wait durations
  test("averages the recorded wait durations", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    const [advising, helpDesk] = response.body.report;

    expect(advising.averageWaitDurationMinutes).toBe(20); //(10 + 20 + 30) / 3
    expect(helpDesk.averageWaitDurationMinutes).toBe(5);
  });


  //only entries still waiting count towards the live queue length
  test("counts the people currently waiting", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    const [advising, helpDesk] = response.body.report;

    expect(advising.activeWaiting).toBe(2);
    expect(helpDesk.activeWaiting).toBe(0); //the help desk entry is already being served
  });


  //another admin's service never appears in the report
  test("excludes services owned by another admin", async () => {
    const response = await getReport("/api/reports/queue-stats", REPORT_ADMIN);

    const serviceIds = response.body.report.map((row) => row.serviceId);

    expect(serviceIds).not.toContain(otherAdminService._id.toString());
  });


  //an admin without services gets an empty report rather than an error
  test("returns an empty report for an admin with no services", async () => {
    const response = await getReport("/api/reports/queue-stats", "admin-report-nobody");

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.report).toEqual([]);
  });
});




//group the queue statistics CSV export
describe("Queue statistics CSV export", () => {

  //the export is returned as a downloadable CSV file
  test("returns a downloadable CSV file", async () => {
    const response = await getReport("/api/reports/queue-stats.csv", REPORT_ADMIN);

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/csv/);
    expect(response.headers["content-disposition"]).toBe("attachment; filename=queue-statistics.csv");
  });


  //the first line names every exported column
  test("starts with the column header row", async () => {
    const response = await getReport("/api/reports/queue-stats.csv", REPORT_ADMIN);

    const [header] = response.text.split("\n");

    expect(header).toBe(
      "serviceId,serviceName,adminId,isOpen,expectedDuration,activeWaiting,servedCount,leftCount,removedCount,totalCompleted,averageWaitDurationMinutes"
    );
  });


  //one row is exported per service, with the calculated figures
  test("exports one row per service", async () => {
    const response = await getReport("/api/reports/queue-stats.csv", REPORT_ADMIN);

    const rows = response.text.split("\n");

    expect(rows).toHaveLength(3); //one header row plus two services
    expect(rows[1]).toContain('"Report Test Advising"');
    expect(rows[1]).toContain('"20"'); //the average wait time
    expect(response.text).not.toContain("Report Other Admin Service");
  });
});
