import React from "react";
import { Icon } from "../components/Icons";
import {PageHeader, StatusBadge, PriorityBadge, EmptyState, formatWait,} from "../components/Shared";
import {serveNext as serveNextApi, removeUserFromQueue, reorderQueue, getQueue} from "../api/queuesApi";






export default function QueueManagement({services, setServices, initialServiceId }) {
  const fallback = services[0]?.id || '';
  const [selectedId, setSelectedId] = React.useState(initialServiceId || fallback);
  const selected = services.find((service) => service.id === selectedId) || services[0];

  React.useEffect(() => {
    if (initialServiceId) setSelectedId(initialServiceId);
  }, [initialServiceId]);


  React.useEffect(() => {
  async function loadSelectedQueue() {
    if (!selected?.id) return;

    try {
      const data = await getQueue(selected.id);

      setServices((current) =>
        current.map((service) =>
          service.id === selected.id
            ? {
                ...service,
                queue: data.queue.map(normalizeQueueEntry),
              }
            : service
        )
      );
    } catch (error) {
      console.error("Failed to load queue:", error);
    }
  }

  loadSelectedQueue();
}, [selected?.id, setServices]);



  function normalizeQueueEntry(entry) {
  return {
    id: entry.userId,
    entryId: entry.id,
    name: entry.userName,
    joinedAt: entry.joinedAt,
    priority: entry.priority,
    status: entry.status,
    type: entry.type,
    appointmentTime: entry.appointmentTime,
  };
}

  function updateQueue(nextQueue) {
    setServices((current) => current.map((service) => service.id === selected.id ? { ...service, queue: nextQueue } : service));
  }

  async function move(index, direction) {
    const queue = selected.queue || [];
    const target = index + direction;


    if (target < 0 || target >= selected.queue.length) return;


    const next = [...selected.queue];
    [next[index], next[target]] = [next[target], next[index]];


    const orderedUserIds = next.map((user) => user.id);

    try {
        const data = await reorderQueue(selected.id, orderedUserIds);
        updateQueue(data.queue.map(normalizeQueueEntry));

        
    } catch (error) {
       window.alert(error.error || "Could not reorder queue."); 
    }
  }

async function remove(user) {
    if (window.confirm(`Remove ${user.name} from this queue?`)) return;

    try {
        const data = await removeUserFromQueue(selected.id, user.id);  //handle remove user
        updateQueue(data.queue.map(normalizeQueueEntry)); 

    } catch (error) {
        window.alert(error.error || "Failed to remove user from queue.");
    }
  }

async function serveNext() {
    if (!selected.queue.length) return;


    try {
        const data = await serveNextApi(selected.id);
        updateQueue(data.queue.map(normalizeQueueEntry));

        window.alert(`${data.servedEntry.userName} has been marked as served.`);
    } catch (error) {
        window.alert(error.error || "Failed to serve next user.");

    }
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
        <div className="panel-heading compact-heading"><div><h2>{selected.name} queue</h2><p>View waitlist, reorder list, remove users.</p></div></div>
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
