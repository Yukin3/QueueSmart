const queueHistory = require("../data/queueHistory");

//record a completed queue participation for a user
//outcome describes how the participation ended: "served", "left", or "removed"
function recordParticipation(entry, service, outcome, endedAt = new Date().toISOString()) {
  const joinedTime = new Date(entry.joinedAt).getTime();
  const endedTime = new Date(endedAt).getTime();

  //time spent in the queue, in whole minutes (0 if timestamps are unavailable)
  const waitDurationMinutes =
    Number.isNaN(joinedTime) || Number.isNaN(endedTime)
      ? 0
      : Math.max(0, Math.round((endedTime - joinedTime) / 60000));

  const record = {
    id: `history-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entryId: entry.id,
    userId: entry.userId,
    userName: entry.userName,
    serviceId: entry.serviceId,
    serviceName: service ? service.name : null,
    outcome,
    type: entry.type,
    priority: entry.priority,
    appointmentTime: entry.appointmentTime,
    joinedAt: entry.joinedAt,
    endedAt,
    waitDurationMinutes,
  };

  queueHistory.push(record); //store participation record

  return record;
}


module.exports = {
  recordParticipation,
};
