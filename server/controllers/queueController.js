const queueEntries = require("../data/queueEntries");
const services = require("../data/services");
const queueHistory = require("../data/queueHistory");
const { notifyQueueJoined, notifyNextInLine } = require("../services/notificationService");
const { recordParticipation } = require("../services/historyService");
const { estimateWaitTime } = require("../utils/waitTime");



//notify whoever is currently next in line for a service (close to being served)
function notifyNextInLineForService(serviceId, service) {
  const waitingQueue = queueEntries.filter(
    (entry) => entry.serviceId === serviceId && entry.status === "waiting"
  );

  if (waitingQueue.length === 0) {
    return;
  }

  const sortedQueue = sortQueueEntries(waitingQueue);
  const nextEntry = sortedQueue[0];

  //only notify when the service is open and able to serve
  if (service.isOpen) {
    notifyNextInLine(nextEntry, service);
  }
}



//sort queue entry items
function sortQueueEntries(entries) {
  const now = new Date();
  const appointmentWindowMinutes = 25;


  return [...entries].sort((a, b) => {
    //if both entries have manualOrder, admin reorder takes priority
    if (a.manualOrder !== undefined && b.manualOrder !== undefined) {
    return a.manualOrder - b.manualOrder;
    }

    const aApptTime = a.appointmentTime ? new Date(a.appointmentTime) : null;
    const bApptTime = b.appointmentTime ? new Date(b.appointmentTime) : null;


    //check if entry A within window
    const aIsDueAppointment =
      a.type === "appointment" &&
      aApptTime &&
      aApptTime.getTime() - now.getTime() <= appointmentWindowMinutes * 60 * 1000;


    //check if entry B within window
    const bIsDueAppointment =
      b.type === "appointment" &&
      bApptTime &&
      bApptTime.getTime() - now.getTime() <= appointmentWindowMinutes * 60 * 1000;




    //prioritize due appointment
    if (aIsDueAppointment && !bIsDueAppointment){
        return -1;
    } 
    if (!aIsDueAppointment && bIsDueAppointment){ 
        return 1;
    }

    
    //if both due, edf
    if (aIsDueAppointment && bIsDueAppointment) {
      return aApptTime - bApptTime;
    }



    //give number rank to priorities
    const priorityRank = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4,
    };



    //handle missing priority
    const aRank = priorityRank[a.priority] || 3;
    const bRank = priorityRank[b.priority] || 3;


    //sort by prior. if dif ranks
    if (aRank !== bRank) {
        return aRank - bRank;
    }


    //if same, fifo
    return new Date(a.joinedAt) - new Date(b.joinedAt);

  });


}



//get queue for a service
function getQueue(req, res) {
  const { serviceId } = req.params;
  const service = services.find((item) => item.id === serviceId);


  if (!service) {
    return res.status(404).json({error: "Service not found."}); //handle invalid service
  }


  const queue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting"); //filter only actively waiting entries



  //return service info and sorted/filtered queue entries
  return res.json({
    serviceId,
    serviceName: service.name,
    queue: sortQueueEntries(queue),
  });


}




//join a service queue
function joinQueue(req, res) {
  const { serviceId } = req.params;
  const {
    userId,
    userName,
    type = "walk-in",
    priority = "normal",
    appointmentTime = null,
  } = req.body;


  const service = services.find((item) => item.id === serviceId);  //find selected service



  if (!service) {
    return res.status(404).json({error: "Service not found."}); //handle nonexisting service
  }


  if (!service.isOpen) {
    return res.status(400).json({error: "Cannot join a closed service."}); //handle closed service
  }



  const errors = {};


  //request validation
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
    errors.priority = "Priority must be low, normal, high, or urgent.";
  }


  if (type === "appointment" && !appointmentTime) {
    errors.appointmentTime = "Appointment time is required for appointment entries.";
  }


  if (appointmentTime && Number.isNaN(new Date(appointmentTime).getTime())) {
    errors.appointmentTime = "Appointment time must be a valid date/time.";
  }



  //check if alr in queue
  const alreadyWaiting = queueEntries.some(
    (entry) =>
      entry.serviceId === serviceId &&
      entry.userId === userId &&
      entry.status === "waiting"
  );



  //prevent duplicates
  if (alreadyWaiting) {
    errors.userId = "User is already waiting in this queue.";
  }




  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: "Invalid queue entry data.",
      details: errors,
    });
  }



  //create new queue entry item
  const newEntry = {
    id: `entry-${Date.now()}`,
    serviceId,
    userId: userId.trim(),
    userName: userName.trim(),
    joinedAt: new Date().toISOString(),
    status: "waiting",
    type,
    priority,
    appointmentTime,
  };



  queueEntries.push(newEntry); //add new entry to queue

  notifyQueueJoined(newEntry, service); //trigger "joined queue" notification

  notifyNextInLineForService(serviceId, service); //notify user if they are already next in line

  const queue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting"); //filter all waiting entries


  //return new entry object + updated queuue
  return res.status(201).json({
    message: "Joined queue successfully.",
    entry: newEntry,
    queue: sortQueueEntries(queue),
  });

}



//leave a service queue
function leaveQueue(req, res) {
  const { serviceId } = req.params;
  const { userId } = req.body;


  const service = services.find((item) => item.id === serviceId); //find selected service



  if (!service) {
    return res.status(404).json({error: "Service not found."}); //handle nonexisting service
  }



  if (!userId || !userId.trim()) {
    return res.status(400).json({error: "User ID is required."});  //handle missing userId
  }



  //make sure entry in queue
  const entry = queueEntries.find(
    (item) =>
      item.serviceId === serviceId &&
      item.userId === userId &&
      item.status === "waiting"
  );



  if (!entry) {
    return res.status(404).json({error: "User is not currently waiting in this queue."}); //handle nonexisting enttry item
  }


  //update entry details
  entry.status = "left";
  entry.leftAt = new Date().toISOString();


  recordParticipation(entry, service, "left", entry.leftAt); //record participation history



  const queue = queueEntries.filter((item) => item.serviceId === serviceId && item.status === "waiting");  //handle nonexisting service


  notifyNextInLineForService(serviceId, service); //notify the new front of the queue they are next


  //return updated entry object + updated queuue
  return res.json({
    message: "Left queue successfully.",
    entry,
    queue: sortQueueEntries(queue),
  });


}



//remove a user from queue (admin use)
function removeUserFromQueue(req, res) {
  const { serviceId, userId } = req.params;

  const service = services.find((item) => item.id === serviceId);  //find selected service


  if (!service) {
    return res.status(404).json({error: "Service not found."});  //handle nonexisting service
  }


  //check if entry in queue
  const entry = queueEntries.find(
    (item) =>
      item.serviceId === serviceId &&
      item.userId === userId &&
      item.status === "waiting"
  );


  if (!entry) {
    return res.status(404).json({error: "User is not currently waiting in this queue."}); //handle nonexisting entry
  }


  //update entry for deletion
  entry.status = "removed";
  entry.removedAt = new Date().toISOString();


  recordParticipation(entry, service, "removed", entry.removedAt); //record participation history


  const queue = queueEntries.filter((item) => item.serviceId === serviceId && item.status === "waiting"); //filter waiting entries


  notifyNextInLineForService(serviceId, service); //notify the new front of the queue they are next


  //return removed queue entry + updated queue
  return res.json({
    message: "User removed from queue successfully.",
    entry,
    queue: sortQueueEntries(queue),
  });

}


function serveNext(req, res) {
const { serviceId } = req.params;
const service = services.find((item) => item.id === serviceId); //find selected service


if (!service) {
return res.status(404).json({error: "Service not found."});//handle nonexisting service
}


const waitingQueue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting");  //filter waiting entries



if (waitingQueue.length === 0) {
return res.status(400).json({error: "No users are waiting in this queue."});  //handle empty queue
}


//assign next to be served
const sortedQueue = sortQueueEntries(waitingQueue);
const nextEntry = sortedQueue[0];


//update queue entry details
nextEntry.status = "serving";
nextEntry.servingStartedAt = new Date().toISOString();


recordParticipation(nextEntry, service, "served", nextEntry.servingStartedAt); //record participation history



const remainingQueue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting");  //filter remaining waiting entries


notifyNextInLineForService(serviceId, service); //notify the new front of the queue they are next



//return entry to be served + remaining queue
return res.json({
message: "Next user is now being served.",
servedEntry: nextEntry,
queue: sortQueueEntries(remainingQueue),
});

}


//reorder queueEntries for a service
function reorderQueue(req, res) {
  const { serviceId } = req.params;
  const { orderedUserIds } = req.body;

  const service = services.find((item) => item.id === serviceId); //find selected service



  if (!service) {
    return res.status(404).json({error: "Service not found."}); //handle nonexisting service
  }



  if (!Array.isArray(orderedUserIds) || orderedUserIds.length === 0) {
    return res.status(400).json({error: "orderedUserIds must be a non-empty array."});  //handle empty queue
  }


  const waitingEntries = queueEntries.filter( (item) => item.serviceId === serviceId && item.status === "waiting"); //filter waiting queueEntries

  const waitingUserIds = waitingEntries.map((entry) => entry.userId); //create //create an array of userIds for waiting entries

  const hasSameUsers = orderedUserIds.length === waitingUserIds.length && orderedUserIds.every((id) => waitingUserIds.includes(id)); //confirm list has all waiting users and queue count is unchanged



  if (!hasSameUsers) {
    return res.status(400).json({error: "orderedUserIds must include every waiting user exactly once."});  //handle changed queue count
  }



  //assign numeric position to entries
  orderedUserIds.forEach((userId, index) => {
    const entry = waitingEntries.find((item) => item.userId === userId);
    entry.manualOrder = index;
  });



  const reorderedQueue = sortQueueEntries(waitingEntries); //sort entries in position order


  //return reorder queue
  return res.json({
    message: "Queue reordered successfully.",
    queue: reorderedQueue,
  });


}

//get queue entry wait time 
function getWaitTime(req, res) {
  const { serviceId, userId } = req.params;

  const service = services.find((item) => item.id === serviceId);

  if (!service) {
    return res.status(404).json({error: "Service not found."});  //handle nonexisting service
  }


  const waitingQueue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting"); //filter waiting queueEntries


  const sortedQueue = sortQueueEntries(waitingQueue); //sort waiting entries

  const positionIndex = sortedQueue.findIndex((entry) => entry.userId === userId); //assign numerical position


  if (positionIndex === -1) {
    return res.status(404).json({error: "User is not currently waiting in this queue."});  //handle entry not in queue
  }



  const estimatedWait = estimateWaitTime(positionIndex, service.expectedDuration);  //calculate estimated wait time


  //return user queue position + wait information
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


}


//get service wait time
function getServiceWaitTime(req, res) {
  const { serviceId } = req.params;

  const service = services.find((item) => item.id === serviceId);



  if (!service) {
    return res.status(404).json({error: "Service not found."});  //handle nonexisting service
  }



  const waitingQueue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting");  //filter waiting queueEntries



  const sortedQueue = sortQueueEntries(waitingQueue);  //sort waiting entries



  const estimatedWaitIfJoining = estimateWaitTime(sortedQueue.length, service.expectedDuration);  //calculate estimated wait time


  //return service wait time info
  return res.json({
    serviceId,
    serviceName: service.name,
    peopleWaiting: sortedQueue.length,
    expectedDuration: service.expectedDuration,
    estimatedWaitIfJoining,
    estimatedWaitLabel: `~${estimatedWaitIfJoining} min`,
  });


}


//get a users current queues
function getCurrentUserQueues(req, res) {
  const { userId } = req.params;



  const userEntries = queueEntries.filter((entry) => entry.userId === userId && entry.status === "waiting"); //find all user's waiting entries


  //create queue info
  const currentQueues = userEntries.map((entry) => {

    const service = services.find((item) => item.id === entry.serviceId);  //handle nonexisting service


    //skip entry if service doesnt exist
    if (!service) {
      return null;
    }



    const waitingQueue = queueEntries.filter((item) => item.serviceId === entry.serviceId && item.status === "waiting");  //sort waiting entries



    const sortedQueue = sortQueueEntries(waitingQueue);
    const positionIndex = sortedQueue.findIndex((item) => item.userId === userId);  //assign numerical positions



    const estimatedWait = estimateWaitTime(positionIndex, service.expectedDuration);  //calculate estimated wait time


    //check almost status
    const displayStatus = positionIndex === 0 && service.isOpen ? "almost" : "waiting";


    
    //return combined queue Entries info
    return {
      serviceId: service.id,
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
    };
  }).filter(Boolean);



  //return all users active queues
  return res.json({
    userId,
    queues: currentQueues,
  });


}



//get a user's queue participation history
function getUserHistory(req, res) {
  const { userId } = req.params;
  const { serviceId, outcome } = req.query;


  //validate optional outcome filter
  if (outcome && !["served", "left", "removed"].includes(outcome)) {
    return res.status(400).json({error: "Outcome must be served, left, or removed."});
  }


  let history = queueHistory.filter((record) => record.userId === userId); //find all of the user's participation records


  if (serviceId) {
    history = history.filter((record) => record.serviceId === serviceId); //optional filter by service
  }


  if (outcome) {
    history = history.filter((record) => record.outcome === outcome); //optional filter by outcome
  }


  //sort most recent first
  history = [...history].sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));


  //return the user's participation history
  return res.json({
    userId,
    count: history.length,
    history,
  });


}



module.exports = {
  getQueue, joinQueue, leaveQueue, serveNext, removeUserFromQueue, reorderQueue, getWaitTime, getServiceWaitTime, getCurrentUserQueues, getUserHistory,
};