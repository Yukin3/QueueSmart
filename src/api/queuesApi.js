import { apiRequest } from "./client";


//handle GET queues
export function getQueue(serviceId) {
  return apiRequest(`/queues/${serviceId}`);
}


//handle join queue
export function joinQueue(serviceId, user) {
  return apiRequest(`/queues/${serviceId}/join`, {
    method: "POST",
    body: JSON.stringify({
      userId: user.id,
      userName: user.name,
      type: "walk-in",
      priority: "normal",
    }),
  });
}


//handle leave queue
export function leaveQueue(serviceId, userId) {
  return apiRequest(`/queues/${serviceId}/leave`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}


//handle next in queue
export function serveNext(serviceId) {
  return apiRequest(`/queues/${serviceId}/serve-next`, {
    method: "POST",
  });
}


//handle admin remove from queue
export function removeUserFromQueue(serviceId, userId) {
  return apiRequest(`/queues/${serviceId}/users/${userId}`, {
    method: "DELETE",
  });
}


//handle queue reorder 
export function reorderQueue(serviceId, orderedUserIds) {
  return apiRequest(`/queues/${serviceId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ orderedUserIds }),
  });
}


// handle wait time
export function getWaitTime(serviceId, userId) {
  return apiRequest(`/queues/${serviceId}/wait-time/${userId}`);
}