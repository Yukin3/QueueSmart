import React from "react";
import { Icon } from "../components/Icons";
import {PageHeader, StatusBadge, PriorityBadge, formatWait,} from "../components/Shared";




export default function Dashboard({ services, setServices, goTo }) {
  const openServices = services.filter((service) => service.isOpen).length;
  const peopleWaiting = services.reduce((sum, service) => sum + service.queue.length, 0);
  const averageWait = peopleWaiting
    ? Math.round(services.reduce((sum, service) => sum + service.queue.length * service.expectedDuration, 0) / peopleWaiting)
    : 0;

  function toggleService(id) {
    setServices((current) => current.map((service) => service.id === id ? { ...service, isOpen: !service.isOpen } : service));
  }

  return (
    <>
      <PageHeader eyebrow="Administrator" title="Dashboard" description="Monitor services, queue activity, and daily workload." />
      <section className="stat-grid">
        <article className="stat-card"><div className="stat-icon"><Icon name="services" /></div><div><span>Open services</span><strong>{openServices}<small> / {services.length}</small></strong></div></article>
        <article className="stat-card"><div className="stat-icon"><Icon name="users" /></div><div><span>People waiting</span><strong>{peopleWaiting}</strong></div></article>
        <article className="stat-card"><div className="stat-icon"><Icon name="clock" /></div><div><span>Average wait</span><strong>{averageWait}<small> min</small></strong></div></article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><h2>Service overview</h2><p>Current queue lengths and quick open/close actions.</p></div>
          <button className="button secondary" onClick={() => goTo('services')}>Manage services <Icon name="chevronRight" size={17} /></button>
        </div>
        <div className="service-overview-grid">
          {services.map((service) => (
            <article className="service-overview-card" key={service.id}>
              <div className="service-card-top"><StatusBadge open={service.isOpen} /><PriorityBadge level={service.priority} /></div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-metrics">
                <div><span>Queue</span><strong>{service.queue.length}</strong></div>
                <div><span>Estimated wait</span><strong>{formatWait(service)}</strong></div>
              </div>
              <div className="card-actions">
                <button className="button secondary grow" onClick={() => goTo('queues', service.id)}>View queue</button>
                <button className={`button ${service.isOpen ? 'danger-outline' : 'primary'}`} onClick={() => toggleService(service.id)}>{service.isOpen ? 'Close queue' : 'Open queue'}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
