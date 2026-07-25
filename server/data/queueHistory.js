//in-memory store of completed queue participations (no database yet)
//records are appended when a user's queue entry reaches a terminal outcome:
//"served", "left", or "removed"
const queueHistory = [
  {
    id: "history-seed-001",
    entryId: "entry-seed-001",
    userId: "user-001",
    userName: "Avery Johnson",
    serviceId: "svc-help-desk",
    serviceName: "General Help Desk",
    outcome: "served",
    type: "walk-in",
    priority: "normal",
    appointmentTime: null,
    joinedAt: "2026-07-22T09:00:00.000Z",
    endedAt: "2026-07-22T09:14:00.000Z",
    waitDurationMinutes: 14,
  },
  {
    id: "history-seed-002",
    entryId: "entry-seed-002",
    userId: "user-001",
    userName: "Avery Johnson",
    serviceId: "svc-advising",
    serviceName: "Academic Advising",
    outcome: "left",
    type: "walk-in",
    priority: "normal",
    appointmentTime: null,
    joinedAt: "2026-07-20T14:30:00.000Z",
    endedAt: "2026-07-20T14:52:00.000Z",
    waitDurationMinutes: 22,
  },
];

module.exports = queueHistory;
