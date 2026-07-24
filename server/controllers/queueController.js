const queueEntries = require("../data/queueEntries");
const services = require("../data/services");



//sort queue entry items
function sortQueueEntries(entries) {
  const now = new Date();
  const appointmentWindowMinutes = 25;



  return [...entries].sort((a, b) => {
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



  const queue = queueEntries.filter((item) => item.serviceId === serviceId && item.status === "waiting");  //handle nonexisting service


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


  const queue = queueEntries.filter((item) => item.serviceId === serviceId && item.status === "waiting"); //filter waiting entries


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



const remainingQueue = queueEntries.filter((entry) => entry.serviceId === serviceId && entry.status === "waiting");  //filter remaining waiting entries



//return entry to be served + remaining queue
return res.json({
message: "Next user is now being served.",
servedEntry: nextEntry,
queue: sortQueueEntries(remainingQueue),
});

}


module.exports = {
  getQueue, joinQueue, leaveQueue, serveNext,
};