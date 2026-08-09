const Notification = require("../models/Notification");


//get a user's notifications
async function getUserNotifications(req, res) {
  try {
     const { userId } = req.params;
  const { isRead } = req.query;


  //validate optional isRead filter
  if (isRead !== undefined && isRead !== "true" && isRead !== "false") {
    return res.status(400).json({error: "isRead must be true or false."});
  }


  const filter = {userId};


  if (isRead !== undefined) {
    filter.isRead = isRead === "true"; //optional filter by read state
  }


  //sort most recent first
  const userNotifications = await Notification.find(filter).sort({
    createdAt: -1,
  })


  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false, 
  }); //count unread


  //return the user's notifications
  return res.json({
    userId,
    count: userNotifications.length,
    unreadCount,
    notifications: userNotifications.map((notification) => ({
        id: notification.notificationId,
        notificationId: notification.notificationId,
        userId: notification.userId,
        role: notification.role,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        tone: notification.tone,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
        readAt: notification.readAt,
      })),
  }); 
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch notifications.",
      details: error.message,
    });
  }



}


module.exports = {
  getUserNotifications,
};
