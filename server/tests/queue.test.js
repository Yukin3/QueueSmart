const request = require("supertest");
const app = require("../app"); //import express app


//helper: position of a userId within a returned queue array
function positionOf(queue, userId) {
  return queue.findIndex((entry) => entry.userId === userId);
}


//an appointment time inside the 25-min prioritization window
const soonAppointment = new Date(Date.now() + 10 * 60 * 1000).toISOString();




//group queue join validation rules
describe("Queue join validation", () => {

  //valid join succeeds
  test("joins an open queue with valid data", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-valid-1",
      userName: "Valid Joiner",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Joined queue successfully.");
    expect(response.body.entry).toHaveProperty("id");
    expect(response.body.entry.status).toBe("waiting");
    expect(Array.isArray(response.body.queue)).toBe(true);
  });


  //missing userId and userName are rejected together
  test("rejects join with missing userId and userName", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "",
      userName: "   ",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Invalid queue entry data.");
    expect(response.body.details).toHaveProperty("userId");
    expect(response.body.details).toHaveProperty("userName");
  });


  //invalid type is rejected
  test("rejects invalid entry type", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-badtype-1",
      userName: "Bad Type",
      type: "drive-through",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toHaveProperty("type");
  });


  //invalid priority is rejected
  test("rejects invalid priority", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-badpriority-1",
      userName: "Bad Priority",
      priority: "critical",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toHaveProperty("priority");
  });


  //appointment type without a time is rejected
  test("rejects appointment without an appointment time", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-appt-notime",
      userName: "No Time",
      type: "appointment",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toHaveProperty("appointmentTime");
  });


  //invalid appointment date is rejected
  test("rejects invalid appointment date", async () => {
    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-appt-baddate",
      userName: "Bad Date",
      type: "appointment",
      appointmentTime: "not-a-date",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toHaveProperty("appointmentTime");
  });


  //duplicate active entries are rejected
  test("rejects duplicate join for a user already waiting", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-dup-1",
      userName: "Duplicate",
    });

    const response = await request(app).post("/api/queues/svc-advising/join").send({
      userId: "join-dup-1",
      userName: "Duplicate",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.details).toHaveProperty("userId");
  });


  //closed services cannot be joined
  test("rejects joining a closed service", async () => {
    const response = await request(app).post("/api/queues/svc-financial/join").send({
      userId: "join-closed-1",
      userName: "Closed Service",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Cannot join a closed service.");
  });


  //nonexistent service returns 404
  test("returns 404 when joining a missing service", async () => {
    const response = await request(app).post("/api/queues/svc-nope/join").send({
      userId: "join-missing-1",
      userName: "Missing Service",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Service not found.");
  });

});




//group queue prioritization / sorting business logic
describe("Queue prioritization logic", () => {

  //urgent priority is served before normal priority
  test("orders urgent priority ahead of normal priority", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "sort-normal-1",
      userName: "Normal First",
      priority: "normal",
    });

    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "sort-urgent-1",
      userName: "Urgent Later",
      priority: "urgent",
    });

    const response = await request(app).get("/api/queues/svc-advising");
    const queue = response.body.queue;

    //urgent joined later but should rank ahead of the earlier normal entry
    expect(positionOf(queue, "sort-urgent-1")).toBeLessThan(positionOf(queue, "sort-normal-1"));
  });


  //a due appointment is prioritized ahead of a normal walk-in
  test("prioritizes a due appointment ahead of a normal walk-in", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "sort-walkin-1",
      userName: "Walk In",
      priority: "normal",
    });

    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "sort-appt-1",
      userName: "Due Appointment",
      type: "appointment",
      appointmentTime: soonAppointment,
    });

    const response = await request(app).get("/api/queues/svc-advising");
    const queue = response.body.queue;

    expect(positionOf(queue, "sort-appt-1")).toBeLessThan(positionOf(queue, "sort-walkin-1"));
  });

});




//group serve / leave / remove business logic
describe("Queue serve, leave, and remove", () => {

  //serving picks the sorted front entry and marks it serving
  test("serves the next user from the front of the queue", async () => {
    await request(app).post("/api/queues/svc-help-desk/join").send({
      userId: "serve-urgent-1",
      userName: "Serve Urgent",
      priority: "urgent",
    });

    const response = await request(app).post("/api/queues/svc-help-desk/serve-next").send({});

    expect(response.statusCode).toBe(200);
    expect(response.body.servedEntry.userId).toBe("serve-urgent-1");
    expect(response.body.servedEntry.status).toBe("serving");
  });


  //serving an empty queue is rejected
  test("rejects serving when nobody is waiting", async () => {
    //drain svc-financial (closed, always empty) to guarantee an empty queue
    const response = await request(app).post("/api/queues/svc-financial/serve-next").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No users are waiting in this queue.");
  });


  //leaving a queue succeeds for a waiting user
  test("lets a waiting user leave the queue", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "leave-1",
      userName: "Leaver",
    });

    const response = await request(app).post("/api/queues/svc-advising/leave").send({
      userId: "leave-1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.entry.status).toBe("left");
  });


  //leaving without a userId is rejected
  test("rejects leave with missing userId", async () => {
    const response = await request(app).post("/api/queues/svc-advising/leave").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("User ID is required.");
  });


  //leaving when not in the queue returns 404
  test("returns 404 when leaving a queue the user is not in", async () => {
    const response = await request(app).post("/api/queues/svc-advising/leave").send({
      userId: "never-joined-1",
    });

    expect(response.statusCode).toBe(404);
  });


  //admin removal succeeds for a waiting user
  test("removes a waiting user (admin action)", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "remove-1",
      userName: "To Remove",
    });

    const response = await request(app).delete("/api/queues/svc-advising/users/remove-1");

    expect(response.statusCode).toBe(200);
    expect(response.body.entry.status).toBe("removed");
  });

});




//group reorder validation rules
describe("Queue reorder validation", () => {

  //orderedUserIds must be a non-empty array
  test("rejects reorder with a non-array payload", async () => {
    const response = await request(app).patch("/api/queues/svc-advising/reorder").send({
      orderedUserIds: "not-an-array",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("orderedUserIds must be a non-empty array.");
  });


  //orderedUserIds must match the waiting users exactly
  test("rejects reorder that does not match waiting users", async () => {
    const response = await request(app).patch("/api/queues/svc-advising/reorder").send({
      orderedUserIds: ["ghost-user-that-is-not-waiting"],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("orderedUserIds must include every waiting user exactly once.");
  });

});




//group wait-time calculations
describe("Wait-time calculations", () => {

  //service wait time reflects people waiting * expected duration
  test("computes service wait time from queue length", async () => {
    const response = await request(app).get("/api/queues/svc-advising/wait-time");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("peopleWaiting");
    expect(response.body.estimatedWaitIfJoining).toBe(
      response.body.peopleWaiting * response.body.expectedDuration
    );
  });


  //user wait time reflects position ahead * expected duration
  test("computes a user's wait time from their position", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "wait-user-1",
      userName: "Wait User",
    });

    const response = await request(app).get("/api/queues/svc-advising/wait-time/wait-user-1");

    expect(response.statusCode).toBe(200);
    expect(response.body.estimatedWait).toBe(
      response.body.peopleAhead * response.body.expectedDuration
    );
    expect(response.body.position).toBe(response.body.peopleAhead + 1);
  });


  //wait time for a user not in the queue returns 404
  test("returns 404 for wait time of a user not in the queue", async () => {
    const response = await request(app).get("/api/queues/svc-advising/wait-time/not-waiting-1");

    expect(response.statusCode).toBe(404);
  });

});




//group participation history business logic
describe("Queue participation history", () => {

  //a completed participation is recorded and retrievable
  test("records history when a user leaves and exposes it via the API", async () => {
    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "history-user-1",
      userName: "History User",
    });

    await request(app).post("/api/queues/svc-advising/leave").send({
      userId: "history-user-1",
    });

    const response = await request(app).get("/api/queues/users/history-user-1/history");

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
    const record = response.body.history[0];
    expect(record.outcome).toBe("left");
    expect(record.serviceId).toBe("svc-advising");
    expect(record).toHaveProperty("waitDurationMinutes");
  });


  //history can be filtered by outcome
  test("filters history by outcome", async () => {
    const response = await request(app).get("/api/queues/users/user-001/history?outcome=served");

    expect(response.statusCode).toBe(200);
    expect(response.body.history.every((record) => record.outcome === "served")).toBe(true);
  });


  //an invalid outcome filter is rejected
  test("rejects an invalid outcome filter", async () => {
    const response = await request(app).get("/api/queues/users/user-001/history?outcome=bogus");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Outcome must be served, left, or removed.");
  });

});




//group notification triggers (logged, no email/SMS)
describe("Notification triggers", () => {

  //joining a queue records a queue-joined notification for the user
  test("creates a queue-joined notification when a user joins", async () => {
    const notifications = require("../data/notifications");
    const before = notifications.length;

    await request(app).post("/api/queues/svc-advising/join").send({
      userId: "notif-join-1",
      userName: "Notify Join",
    });

    const joined = notifications.find(
      (n) => n.userId === "notif-join-1" && n.type === "queue-joined"
    );

    expect(notifications.length).toBeGreaterThan(before);
    expect(joined).toBeDefined();
    expect(joined.tone).toBe("info");
  });


  //the front of the queue receives an almost-your-turn notification
  test("creates an almost-your-turn notification for the next-in-line user", async () => {
    const notifications = require("../data/notifications");

    //fresh user becomes the sole waiting entry after we serve everyone ahead
    await request(app).post("/api/queues/svc-financial/join").send({
      userId: "notif-next-1",
      userName: "Notify Next",
    }).catch(() => {}); //closed service will reject; use an open one instead

    await request(app).post("/api/queues/svc-help-desk/join").send({
      userId: "notif-next-1",
      userName: "Notify Next",
      priority: "urgent",
    });

    const almost = notifications.find(
      (n) => n.userId === "notif-next-1" && n.type === "queue-status"
    );

    expect(almost).toBeDefined();
    expect(almost.tone).toBe("success");
  });

});
