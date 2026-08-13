import React, { useState, useEffect } from 'react';
import { PageHeader, StateBadge, EmptyState } from '../components/Shared';
import { Icon } from '../components/Icons';
import { getCurrentUserQueues } from '../api/queuesApi';

const STEPS = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'almost', label: 'Almost ready' },
  { key: 'served', label: 'Served' },
];
const ORDER = { waiting: 0, almost: 1, served: 2 };

export default function QueueStatus({ currentUser, onLeave }) {
  const [myQueues, setMyQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCurrentUserQueues(userId)
      .then((data) => {
        if (!cancelled) setMyQueues(data.queues || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your queue status.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <>
      <PageHeader
        eyebrow="My Account"
        title="Queue Status"
        description="Track your live position, estimated wait, and status updates."
      />

      {loading ? (
        <section className="panel"><p style={{ padding: '1.25rem' }}>Loading your queues…</p></section>
      ) : error ? (
        <section className="panel"><p style={{ padding: '1.25rem' }}>{error}</p></section>
      ) : myQueues.length ? (
        <div className="status-stack">
          {myQueues.map((entry) => {
            const status = entry.displayStatus || 'waiting';

            return (
              <section className="panel status-card" key={entry.serviceId}>
                <div className="status-card-head">
                  <div><h2>{entry.serviceName}</h2><p>{entry.serviceDescription}</p></div>
                  <StateBadge state={status} />
                </div>

                <div className="status-metrics">
                  <div className="status-metric">
                    <span>Your position</span>
                    <strong className="big-number">{entry.position}</strong>
                    <small>of {entry.peopleWaiting} waiting</small>
                  </div>
                  <div className="status-metric">
                    <span>Estimated wait</span>
                    <strong className="big-number">{entry.estimatedWait}</strong>
                    <small>
                      {entry.waitBasis === 'historical'
                        ? `minutes · based on last ${entry.waitSampleSize} visits`
                        : 'minutes · estimated'}
                    </small>
                  </div>
                  <div className="status-metric">
                    <span>Queue status</span>
                    <strong>{entry.isOpen ? 'Open' : 'Paused'}</strong>
                    <small>{entry.isOpen ? 'Moving now' : 'Temporarily closed'}</small>
                  </div>
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
                  <button className="button danger-outline" onClick={() => onLeave(entry.serviceId)}>
                    <Icon name="close" size={17} /> Leave queue
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <EmptyState title="You're not in any queues" message="Join a service to see your live status here." icon="clock" />
        </section>
      )}
    </>
  );
}
