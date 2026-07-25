const notifications = require("../data/notifications");

//create, store, and log a notification
function createNotification({ userId, role = "user", title, message, type, tone = "info" }) {
  const notification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    role,
    title,
    message,
    type,
    tone,
    createdAt: new Date().toISOString(),
    isRead: false,
    readAt: null,
  };

  notifications.push(notification); //store notification

  //log notification (no email/SMS delivery yet)
  console.log(`[NOTIFICATION] -> ${userId} | ${title}: ${message}`);

  return notification;
}


//notify a user they successfully joined a queue
function notifyQueueJoined(entry, service) {
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
function notifyNextInLine(entry, service) {
  //avoid sending the same "almost" notification more than once per entry
  if (entry.almostNotified) {
    return null;
  }

  entry.almostNotified = true;

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
