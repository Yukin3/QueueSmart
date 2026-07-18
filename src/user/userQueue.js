import { waitForPosition } from '../components/Shared';

// Derives the current user's live status from the shared services state. Queue
// entries are matched by id (the mock current user shares an id with a seeded
// queue entry); once authentication exists this becomes a userId match.

export function statusForPosition(service, index) {
  if (index === 0 && service.isOpen) return 'almost';
  return 'waiting';
}

export function getUserQueues(services, userId) {
  return services.flatMap((service) => {
    const index = service.queue.findIndex((user) => user.id === userId);
    if (index === -1) return [];
    return [
      {
        service,
        index,
        position: index + 1,
        wait: waitForPosition(service, index),
        status: statusForPosition(service, index),
      },
    ];
  });
}

// Builds the in-app notification feed (queue + status updates) for a user.
export function getUserNotifications(services, userId) {
  const notifications = [];
  getUserQueues(services, userId).forEach(({ service, position, status }) => {
    if (status === 'almost') {
      notifications.push({
        id: `almost-${service.id}`,
        tone: 'success',
        title: 'Almost your turn',
        message: `You are next in line for ${service.name}.`,
      });
    } else {
      notifications.push({
        id: `waiting-${service.id}`,
        tone: 'info',
        title: `Queued for ${service.name}`,
        message: `You are position ${position} of ${service.queue.length} waiting.`,
      });
    }
    if (!service.isOpen) {
      notifications.push({
        id: `closed-${service.id}`,
        tone: 'warning',
        title: `${service.name} is paused`,
        message: 'The queue is temporarily closed, but your spot is saved.',
      });
    }
  });
  return notifications;
}
