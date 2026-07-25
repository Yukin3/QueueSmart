import { apiRequest } from "./client";   //import API function


//handle GET user notifications
export function getNotifications(userId, query = "") {
  return apiRequest(`/notifications/${userId}${query}`);
}
