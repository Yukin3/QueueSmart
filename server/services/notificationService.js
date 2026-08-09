const Notification = require("../models/Notification");

//create, store, and log a notification
async function createNotification({ userId, role = "user", title, message, type, tone = "info" }) {
  const notification = await Notification.create({
    notificationId: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    role,
    title,
    message,
    type,
    tone,
    isRead: false,
    readAt: null,
  });


  //log notification (no email/SMS delivery yet)
  console.log(`[NOTIFICATION] -> ${userId} | ${title}: ${message}`);

  return notification;
}


//notify a user they successfully joined a queue
async function notifyQueueJoined(entry, service) {
  return createNotification({
    userId: entry.userId,
    role: "user",
    title: "You're in Line!",
    message: `You joined the ${service.name} queue.`,
    type: "queue-joined",
    tone: "info",
  });
}


//notify a user they are next in line / close to being served
async function notifyNextInLine(entry, service) {
  //avoid sending the same "almost" notification more than once per entry
  if (entry.almostNotified) {
    return null;
  }

  entry.almostNotified = true;

  //update notif state
  if (typeof entry.save === "function") {
    await entry.save();
  }

  return createNotification({
    userId: entry.userId,
    role: "user",
    title: "It's Almost Your Turn!",
    message: `You are next in line for ${service.name}.`,
    type: "queue-status",
    tone: "success",
  });
}


module.exports = {
  createNotification,
  notifyQueueJoined,
  notifyNextInLine,
};
