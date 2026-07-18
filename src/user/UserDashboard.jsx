import React from 'react';
import { PageHeader, StatusBadge, StateBadge, EmptyState } from '../components/Shared';
import { Icon } from '../components/Icons';
import { getUserQueues, getUserNotifications } from './userQueue';

const TONE_ICON = { success: 'check', info: 'bell', warning: 'alert' };

export default function UserDashboard({ services, currentUser, onJoin, onLeave, goTo }) {
  const myQueues = getUserQueues(services, currentUser.id);
  const notifications = getUserNotifications(services, currentUser.id);
  const openServices = services.filter((service) => service.isOpen);

  return (
    <>
      <PageHeader
        eyebrow="My Account"
        title={`Welcome back, ${currentUser.name.split(' ')[0]}`}
        description="Track your queues, join a new service, and stay up to date."
      />

      <section className="stat-grid">
        <article className="stat-card"><div className="stat-icon"><Icon name="queue" /></div><div><span>Active queues</span><strong>{myQueues.length}</strong></div></article>
        <article className="stat-card"><div className="stat-icon"><Icon name="services" /></div><div><span>Services open</span><strong>{openServices.length}<small> / {services.length}</small></strong></div></article>
        <article className="stat-card"><div className="stat-icon"><Icon name="bell" /></div><div><span>Notifications</span><strong>{notifications.length}</strong></div></article>
      </section>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading compact-heading">
            <div><h2>Your active queues</h2><p>Live position and estimated wait.</p></div>
            <button className="button secondary" onClick={() => goTo('join')}>Join a queue <Icon name="chevronRight" size={17} /></button>
          </div>
          {myQueues.length ? (
            <div className="mini-list">
              {myQueues.map(({ service, position, wait, status }) => (
                <div className="mini-row" key={service.id}>
                  <span className="position-number">{position}</span>
                  <div className="mini-main"><strong>{service.name}</strong><span>~{wait} min estimated wait</span></div>
                  <StateBadge state={status} />
                  <div className="row-actions">
                    <button className="button small secondary" onClick={() => goTo('status')}>Status</button>
                    <button className="button small danger-outline" onClick={() => onLeave(service.id)}>Leave</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="You're not in any queues" message="Join an open service to reserve your spot." />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading compact-heading"><div><h2>Notifications</h2><p>Queue and status updates.</p></div></div>
          {notifications.length ? (
            <ul className="notif-list">
              {notifications.map((note) => (
                <li className={`notif-row ${note.tone}`} key={note.id}>
                  <span className="notif-icon"><Icon name={TONE_ICON[note.tone] || 'bell'} size={16} /></span>
                  <div><strong>{note.title}</strong><p>{note.message}</p></div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No new notifications" message="You're all caught up for now." icon="bell" />
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading compact-heading"><div><h2>Active services available</h2><p>Services currently open to join.</p></div></div>
        {openServices.length ? (
          <div className="service-overview-grid">
            {openServices.map((service) => {
              const inQueue = service.queue.some((user) => user.id === currentUser.id);
              return (
                <article className="service-overview-card stretch" key={service.id}>
                  <div className="service-card-top"><StatusBadge open={service.isOpen} /><span className={`priority-badge ${service.priority}`}>{service.priority}</span></div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-metrics">
                    <div><span>People waiting</span><strong>{service.queue.length}</strong></div>
                    <div><span>{inQueue ? 'Your wait' : 'Est. wait'}</span><strong>~{service.queue.length * service.expectedDuration} min</strong></div>
                  </div>
                  <div className="card-actions">
                    {inQueue ? (
                      <button className="button danger-outline grow" onClick={() => onLeave(service.id)}><Icon name="close" size={17} /> Leave queue</button>
                    ) : (
                      <button className="button primary grow" onClick={() => onJoin(service.id)}><Icon name="plus" size={17} /> Join queue</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No services open" message="Please check back later." icon="services" />
        )}
      </section>
    </>
  );
}
