import React from "react";
import { Icon } from "../components/Icons";
import {PageHeader, StatusBadge, PriorityBadge, EmptyState, formatWait,} from "../components/Shared";



export default function QueueManagement({services, setServices, initialServiceId }) {
  const fallback = services[0]?.id || '';
  const [selectedId, setSelectedId] = React.useState(initialServiceId || fallback);
  const selected = services.find((service) => service.id === selectedId) || services[0];

  React.useEffect(() => {
    if (initialServiceId) setSelectedId(initialServiceId);
  }, [initialServiceId]);

  function updateQueue(nextQueue) {
    setServices((current) => current.map((service) => service.id === selected.id ? { ...service, queue: nextQueue } : service));
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= selected.queue.length) return;
    const next = [...selected.queue];
    [next[index], next[target]] = [next[target], next[index]];
    updateQueue(next);
  }

  function remove(user) {
    if (window.confirm(`Remove ${user.name} from this queue?`)) updateQueue(selected.queue.filter((item) => item.id !== user.id));
  }

  function serveNext() {
    if (!selected.queue.length) return;
    const [nextUser, ...remaining] = selected.queue;
    updateQueue(remaining);
    window.alert(`${nextUser.name} has been marked as served.`);
  }

  if (!selected) return <EmptyState title="No services yet" message="Create a service before managing a queue." />;

  return (
    <>
      <PageHeader eyebrow="Administrator" title="Queue Management" description="Review, reorder, remove, and serve users in a selected service queue." />
      <section className="queue-toolbar panel">
        <label className="field compact"><span>Selected service</span><select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
        <div className="queue-summary"><div><span>Status</span><StatusBadge open={selected.isOpen} /></div><div><span>Waiting</span><strong>{selected.queue.length}</strong></div><div><span>Estimated total wait</span><strong>{formatWait(selected)}</strong></div></div>
        <button className="button primary" disabled={!selected.queue.length || !selected.isOpen} onClick={serveNext}><Icon name="check" size={18} /> Serve next user</button>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading compact-heading"><div><h2>{selected.name} queue</h2><p>UI simulation only; changes are saved in this browser.</p></div></div>
        {selected.queue.length ? (
          <div className="responsive-table-wrap">
            <table className="data-table queue-table">
              <thead><tr><th>Position</th><th>User</th><th>Joined</th><th>Priority</th><th>Estimated wait</th><th className="actions-column">Actions</th></tr></thead>
              <tbody>{selected.queue.map((user, index) => (
                <tr key={user.id}>
                  <td><span className="position-number">{index + 1}</span></td>
                  <td><div className="user-cell"><div className="small-avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><strong>{user.name}</strong></div></td>
                  <td>{user.joinedAt}</td>
                  <td><PriorityBadge level={user.priority} /></td>
                  <td>~{index * selected.expectedDuration} min</td>
                  <td><div className="row-actions">
                    <button className="icon-button" disabled={index === 0} onClick={() => move(index, -1)} title="Move up" aria-label={`Move ${user.name} up`}><Icon name="up" size={17} /></button>
                    <button className="icon-button" disabled={index === selected.queue.length - 1} onClick={() => move(index, 1)} title="Move down" aria-label={`Move ${user.name} down`}><Icon name="down" size={17} /></button>
                    <button className="icon-button danger" onClick={() => remove(user)} title="Remove user" aria-label={`Remove ${user.name}`}><Icon name="trash" size={17} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="This queue is empty" message="There are currently no users waiting for this service." />}
      </section>
    </>
  );
}
