import React from 'react';
import { PageHeader, StatusBadge, PriorityBadge } from '../components/Shared';
import { Icon } from '../components/Icons';

export default function JoinQueue({ services, currentUser, onJoin, onLeave }) {
  return (
    <>
      <PageHeader
        eyebrow="My Account"
        title="Join a Queue"
        description="Choose a service to see the current wait and reserve your spot."
      />
      <section className="join-grid">
        {services.map((service) => {
          const inQueue = service.queue.some((user) => user.id === currentUser.id);
          const projectedWait = service.queue.length * service.expectedDuration;
          return (
            <article className={`service-overview-card stretch ${inQueue ? 'is-joined' : ''}`} key={service.id}>
              <div className="service-card-top"><StatusBadge open={service.isOpen} /><PriorityBadge level={service.priority} /></div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-metrics">
                <div><span>People waiting</span><strong>{service.queue.length}</strong></div>
                <div><span>{inQueue ? 'Your wait' : 'Est. wait if you join'}</span><strong>{service.isOpen ? `~${projectedWait} min` : '—'}</strong></div>
              </div>
              <div className="card-actions">
                {inQueue ? (
                  <button className="button danger-outline grow" onClick={() => onLeave(service.id)}>
                    <Icon name="close" size={17} /> Leave queue
                  </button>
                ) : (
                  <button className="button primary grow" disabled={!service.isOpen} onClick={() => onJoin(service.id)}>
                    <Icon name="plus" size={17} /> {service.isOpen ? 'Join queue' : 'Closed'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
