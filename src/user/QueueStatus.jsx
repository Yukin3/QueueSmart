import React from 'react';
import { PageHeader, StateBadge, EmptyState } from '../components/Shared';
import { Icon } from '../components/Icons';
import { getUserQueues } from './userQueue';

const STEPS = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'almost', label: 'Almost ready' },
  { key: 'served', label: 'Served' },
];
const ORDER = { waiting: 0, almost: 1, served: 2 };

export default function QueueStatus({ services, currentUser, onLeave }) {
  const myQueues = getUserQueues(services, currentUser.id);

  return (
    <>
      <PageHeader
        eyebrow="My Account"
        title="Queue Status"
        description="Track your live position, estimated wait, and status updates."
      />
      {myQueues.length ? (
        <div className="status-stack">
          {myQueues.map(({ service, position, wait, status }) => (
            <section className="panel status-card" key={service.id}>
              <div className="status-card-head">
                <div><h2>{service.name}</h2><p>{service.description}</p></div>
                <StateBadge state={status} />
              </div>

              <div className="status-metrics">
                <div className="status-metric"><span>Your position</span><strong className="big-number">{position}</strong><small>of {service.queue.length} waiting</small></div>
                <div className="status-metric"><span>Estimated wait</span><strong className="big-number">{wait}</strong><small>minutes</small></div>
                <div className="status-metric"><span>Queue status</span><strong>{service.isOpen ? 'Open' : 'Paused'}</strong><small>{service.isOpen ? 'Moving now' : 'Temporarily closed'}</small></div>
              </div>

              <ol className="status-timeline">
                {STEPS.map((step) => {
                  const state =
                    ORDER[step.key] < ORDER[status] ? 'done' : ORDER[step.key] === ORDER[status] ? 'current' : 'todo';
                  return (
                    <li className={`timeline-step ${state}`} key={step.key}>
                      <span className="timeline-dot">{state === 'done' && <Icon name="check" size={14} />}</span>
                      <span className="timeline-label">{step.label}</span>
                    </li>
                  );
                })}
              </ol>

              <div className="card-actions">
                <button className="button danger-outline" onClick={() => onLeave(service.id)}><Icon name="close" size={17} /> Leave queue</button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <EmptyState title="You're not in any queues" message="Join a service to see your live status here." icon="clock" />
        </section>
      )}
    </>
  );
}
