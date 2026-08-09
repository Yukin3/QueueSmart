const QueueEntry = require("../models/QueueEntry");
const Service = require("../models/Service");

const queueHistory = require("../data/queueHistory");
const { notifyQueueJoined, notifyNextInLine } = require("../services/notificationService");
const { recordParticipation } = require("../services/historyService");
const { estimateWaitTime } = require("../utils/waitTime");


//convert Mongo queue entry to normal object
function formatQueueEntry(entry) {
  return {
    id: entry._id.toString(),
    serviceId: entry.serviceId,
    userId: entry.userId,
    userName: entry.userName,
    joinedAt: entry.joinedAt,
    status: entry.status,
    type: entry.type,
    priority: entry.priority,
    appointmentTime: entry.appointmentTime,
    manualOrder: entry.manualOrder,
  };
}


//sort queue entries
function sortQueueEntries(entries) {
  const now = new Date();
  const appointmentWindowMinutes = 25;

  return [...entries].sort((a, b) => {

    //manual admin order takes priority
    if (a.manualOrder !== null && b.manualOrder !== null) {
      return a.manualOrder - b.manualOrder;
    }

    const aApptTime = a.appointmentTime
      ? new Date(a.appointmentTime)
      : null;

    const bApptTime = b.appointmentTime
      ? new Date(b.appointmentTime)
      : null;


    const aIsDueAppointment =
      a.type === "appointment" &&
      aApptTime &&
      aApptTime.getTime() - now.getTime() <=
        appointmentWindowMinutes * 60 * 1000;


    const bIsDueAppointment =
      b.type === "appointment" &&
      bApptTime &&
      bApptTime.getTime() - now.getTime() <=
        appointmentWindowMinutes * 60 * 1000;


    if (aIsDueAppointment && !bIsDueAppointment) {
      return -1;
    }

    if (!aIsDueAppointment && bIsDueAppointment) {
      return 1;
    }

    if (aIsDueAppointment && bIsDueAppointment) {
      return aApptTime - bApptTime;
    }


    const priorityRank = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4,
    };

    const aRank = priorityRank[a.priority] || 3;
    const bRank = priorityRank[b.priority] || 3;

    if (aRank !== bRank) {
      return aRank - bRank;
    }


    //FIFO if priority is same
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });
}


//notify whoever is first in line
async function notifyNextInLineForService(serviceId, service) {

  const entries = await QueueEntry.find({
    serviceId,
    status: "waiting",
  });

  if (entries.length === 0) {
    return;
  }

  const formattedEntries = entries.map(formatQueueEntry);
  const sortedQueue = sortQueueEntries(formattedEntries);

  const nextEntry = sortedQueue[0];

  if (service.isOpen) {
    notifyNextInLine(nextEntry, service);
  }
}


//GET queue for one service
async function getQueue(req, res) {

  try {

    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue = entries.map(formatQueueEntry);


    return res.json({
      serviceId,
      serviceName: service.name,
      queue: sortQueueEntries(queue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to load queue.",
      details: error.message,
    });
  }
}


//JOIN queue
async function joinQueue(req, res) {

  try {

    const { serviceId } = req.params;

    const {
      userId,
      userName,
      type = "walk-in",
      priority = "normal",
      appointmentTime = null,
    } = req.body;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    if (!service.isOpen) {
      return res.status(400).json({
        error: "Cannot join a closed service."
      });
    }


    const errors = {};


    if (!userId || !userId.trim()) {
      errors.userId = "User ID is required.";
    }


    if (!userName || !userName.trim()) {
      errors.userName = "User name is required.";
    }


    if (!["walk-in", "appointment"].includes(type)) {
      errors.type = "Type must be walk-in or appointment.";
    }


    if (!["low", "normal", "high", "urgent"].includes(priority)) {
      errors.priority =
        "Priority must be low, normal, high, or urgent.";
    }


    if (type === "appointment" && !appointmentTime) {
      errors.appointmentTime =
        "Appointment time is required for appointment entries.";
    }


    if (
      appointmentTime &&
      Number.isNaN(new Date(appointmentTime).getTime())
    ) {
      errors.appointmentTime =
        "Appointment time must be a valid date/time.";
    }


    const existingEntry = await QueueEntry.findOne({
      serviceId,
      userId,
      status: "waiting",
    });


    if (existingEntry) {
      errors.userId =
        "User is already waiting in this queue.";
    }


    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: "Invalid queue entry data.",
        details: errors,
      });
    }


    const newEntry = await QueueEntry.create({
      serviceId,
      userId: userId.trim(),
      userName: userName.trim(),
      status: "waiting",
      type,
      priority,
      appointmentTime,
    });


    const formattedEntry = formatQueueEntry(newEntry);


    await notifyQueueJoined(formattedEntry, service);

    await notifyNextInLineForService(serviceId, service);


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue = entries.map(formatQueueEntry);


    return res.status(201).json({
      message: "Joined queue successfully.",
      entry: formattedEntry,
      queue: sortQueueEntries(queue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to join queue.",
      details: error.message,
    });
  }
}


//LEAVE queue
async function leaveQueue(req, res) {

  try {

    const { serviceId } = req.params;
    const { userId } = req.body;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    if (!userId || !userId.trim()) {
      return res.status(400).json({
        error: "User ID is required."
      });
    }


    const entry = await QueueEntry.findOne({
      serviceId,
      userId,
      status: "waiting",
    });


    if (!entry) {
      return res.status(404).json({
        error: "User is not currently waiting in this queue."
      });
    }


    entry.status = "left";
    entry.leftAt = new Date();

    await entry.save();


    const formattedEntry = formatQueueEntry(entry);


    recordParticipation(
      formattedEntry,
      service,
      "left",
      entry.leftAt
    );


    await notifyNextInLineForService(serviceId, service);


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue = entries.map(formatQueueEntry);


    return res.json({
      message: "Left queue successfully.",
      entry: formattedEntry,
      queue: sortQueueEntries(queue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to leave queue.",
      details: error.message,
    });
  }
}


//ADMIN remove user
async function removeUserFromQueue(req, res) {

  try {

    const { serviceId, userId } = req.params;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    const entry = await QueueEntry.findOne({
      serviceId,
      userId,
      status: "waiting",
    });


    if (!entry) {
      return res.status(404).json({
        error: "User is not currently waiting in this queue."
      });
    }


    entry.status = "removed";
    entry.removedAt = new Date();

    await entry.save();


    const formattedEntry = formatQueueEntry(entry);


    recordParticipation(
      formattedEntry,
      service,
      "removed",
      entry.removedAt
    );


    await notifyNextInLineForService(serviceId, service);


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue = entries.map(formatQueueEntry);


    return res.json({
      message: "User removed from queue successfully.",
      entry: formattedEntry,
      queue: sortQueueEntries(queue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to remove user.",
      details: error.message,
    });
  }
}


//SERVE next user
async function serveNext(req, res) {

  try {

    const { serviceId } = req.params;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    if (entries.length === 0) {
      return res.status(400).json({
        error: "No users are waiting in this queue."
      });
    }


    const formattedEntries = entries.map(formatQueueEntry);

    const sortedQueue = sortQueueEntries(formattedEntries);

    const nextEntryData = sortedQueue[0];


    const nextEntry = await QueueEntry.findById(
      nextEntryData.id
    );


    nextEntry.status = "serving";
    nextEntry.servingStartedAt = new Date();

    await nextEntry.save();


    const servedEntry = formatQueueEntry(nextEntry);


    recordParticipation(
      servedEntry,
      service,
      "served",
      nextEntry.servingStartedAt
    );


    await notifyNextInLineForService(serviceId, service);


    const remainingEntries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const remainingQueue =
      remainingEntries.map(formatQueueEntry);


    return res.json({
      message: "Next user is now being served.",
      servedEntry,
      queue: sortQueueEntries(remainingQueue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to serve next user.",
      details: error.message,
    });
  }
}


//REORDER queue
async function reorderQueue(req, res) {

  try {

    const { serviceId } = req.params;
    const { orderedUserIds } = req.body;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    if (
      !Array.isArray(orderedUserIds) ||
      orderedUserIds.length === 0
    ) {
      return res.status(400).json({
        error: "orderedUserIds must be a non-empty array."
      });
    }


    const waitingEntries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const waitingUserIds =
      waitingEntries.map((entry) => entry.userId);


    const hasSameUsers =
      orderedUserIds.length === waitingUserIds.length &&
      orderedUserIds.every(
        (id) => waitingUserIds.includes(id)
      );


    if (!hasSameUsers) {
      return res.status(400).json({
        error:
          "orderedUserIds must include every waiting user exactly once."
      });
    }


    for (let index = 0; index < orderedUserIds.length; index++) {

      await QueueEntry.findOneAndUpdate(
        {
          serviceId,
          userId: orderedUserIds[index],
          status: "waiting",
        },
        {
          manualOrder: index,
        }
      );
    }


    const updatedEntries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue =
      updatedEntries.map(formatQueueEntry);


    return res.json({
      message: "Queue reordered successfully.",
      queue: sortQueueEntries(queue),
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to reorder queue.",
      details: error.message,
    });
  }
}


//GET wait time for one user
async function getWaitTime(req, res) {

  try {

    const { serviceId, userId } = req.params;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue =
      sortQueueEntries(entries.map(formatQueueEntry));


    const positionIndex =
      queue.findIndex(
        (entry) => entry.userId === userId
      );


    if (positionIndex === -1) {
      return res.status(404).json({
        error: "User is not currently waiting in this queue."
      });
    }


    const estimatedWait =
      estimateWaitTime(
        positionIndex,
        service.expectedDuration
      );


    return res.json({
      serviceId,
      serviceName: service.name,
      userId,
      position: positionIndex + 1,
      peopleAhead: positionIndex,
      expectedDuration: service.expectedDuration,
      estimatedWait,
      estimatedWaitLabel: `~${estimatedWait} min`,
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to calculate wait time.",
      details: error.message,
    });
  }
}


//GET wait time for service
async function getServiceWaitTime(req, res) {

  try {

    const { serviceId } = req.params;


    const service = await Service.findById(serviceId);


    if (!service) {
      return res.status(404).json({
        error: "Service not found."
      });
    }


    const entries = await QueueEntry.find({
      serviceId,
      status: "waiting",
    });


    const queue =
      sortQueueEntries(entries.map(formatQueueEntry));


    const estimatedWaitIfJoining =
      estimateWaitTime(
        queue.length,
        service.expectedDuration
      );


    return res.json({
      serviceId,
      serviceName: service.name,
      peopleWaiting: queue.length,
      expectedDuration: service.expectedDuration,
      estimatedWaitIfJoining,
      estimatedWaitLabel:
        `~${estimatedWaitIfJoining} min`,
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to calculate service wait time.",
      details: error.message,
    });
  }
}


//GET user's active queues
async function getCurrentUserQueues(req, res) {

  try {

    const { userId } = req.params;


    const userEntries = await QueueEntry.find({
      userId,
      status: "waiting",
    });


    const currentQueues = [];


    for (const entry of userEntries) {

      const service =
        await Service.findById(entry.serviceId);


      if (!service) {
        continue;
      }


      const waitingEntries =
        await QueueEntry.find({
          serviceId: entry.serviceId,
          status: "waiting",
        });


      const sortedQueue =
        sortQueueEntries(
          waitingEntries.map(formatQueueEntry)
        );


      const positionIndex =
        sortedQueue.findIndex(
          (item) => item.userId === userId
        );


      const estimatedWait =
        estimateWaitTime(
          positionIndex,
          service.expectedDuration
        );


      const displayStatus =
        positionIndex === 0 && service.isOpen
          ? "almost"
          : "waiting";


      currentQueues.push({
        serviceId: service._id.toString(),
        serviceName: service.name,
        serviceDescription: service.description,
        isOpen: service.isOpen,
        userId,
        position: positionIndex + 1,
        peopleAhead: positionIndex,
        peopleWaiting: sortedQueue.length,
        expectedDuration: service.expectedDuration,
        estimatedWait,
        estimatedWaitLabel: `~${estimatedWait} min`,
        status: entry.status,
        displayStatus,
        joinedAt: entry.joinedAt,
        type: entry.type,
        priority: entry.priority,
        appointmentTime: entry.appointmentTime,
      });
    }


    return res.json({
      userId,
      queues: currentQueues,
    });


  } catch (error) {

    return res.status(500).json({
      error: "Failed to load user's queues.",
      details: error.message,
    });
  }
}


//GET user history
//still uses existing history system for now
function getUserHistory(req, res) {

  const { userId } = req.params;
  const { serviceId, outcome } = req.query;


  if (
    outcome &&
    !["served", "left", "removed"].includes(outcome)
  ) {
    return res.status(400).json({
      error: "Outcome must be served, left, or removed."
    });
  }


  let history =
    queueHistory.filter(
      (record) => record.userId === userId
    );


  if (serviceId) {
    history =
      history.filter(
        (record) =>
          record.serviceId === serviceId
      );
  }


  if (outcome) {
    history =
      history.filter(
        (record) => record.outcome === outcome
      );
  }


  history = [...history].sort(
    (a, b) =>
      new Date(b.endedAt) -
      new Date(a.endedAt)
  );


  return res.json({
    userId,
    count: history.length,
    history,
  });
}


module.exports = {
  getQueue,
  joinQueue,
  leaveQueue,
  serveNext,
  removeUserFromQueue,
  reorderQueue,
  getWaitTime,
  getServiceWaitTime,
  getCurrentUserQueues,
  getUserHistory,
};