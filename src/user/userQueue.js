import { waitForPosition } from '../components/Shared';

// Derives the current user's live status from the shared services state. Queue
// entries are matched by id (the mock current user shares an id with a seeded
// queue entry); once authentication exists this becomes a userId match.

export function statusForPosition(service, index) {
  if (index === 0 && service.isOpen) return 'almost';
  return 'waiting';
}

export function getUserQueues(services, userId) {
  if (!userId) return [];
  return services.flatMap((service) => {
    const queue = service.queue || [];
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
