const notifications = require("../data/notifications");


//get a user's notifications
function getUserNotifications(req, res) {
  const { userId } = req.params;
  const { isRead } = req.query;


  //validate optional isRead filter
  if (isRead !== undefined && isRead !== "true" && isRead !== "false") {
    return res.status(400).json({error: "isRead must be true or false."});
  }


  let userNotifications = notifications.filter((item) => item.userId === userId); //find the user's notifications


  if (isRead !== undefined) {
    const wantRead = isRead === "true";
    userNotifications = userNotifications.filter((item) => item.isRead === wantRead); //optional filter by read state
  }


  //sort most recent first
  userNotifications = [...userNotifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );


  const unreadCount = userNotifications.filter((item) => !item.isRead).length; //count unread


  //return the user's notifications
  return res.json({
    userId,
    count: userNotifications.length,
    unreadCount,
    notifications: userNotifications,
  });


}


module.exports = {
  getUserNotifications,
};
