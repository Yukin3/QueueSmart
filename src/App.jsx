import React from 'react';
import Layout from './components/Layout';
import Modal from './components/Modal';
import { Icon } from './components/Icons';
import { initialServices } from './data/mockData';

const STORAGE_KEY = 'queuesmart-admin-services-v1';

function loadServices() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialServices;
  } catch {
    return initialServices;
  }
}

function formatWait(service) {
  if (!service.queue.length) return 'No wait';
  return `~${service.queue.length * service.expectedDuration} min`;
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ open }) {
  return <span className={`status-badge ${open ? 'open' : 'closed'}`}><span className="status-dot" />{open ? 'Open' : 'Closed'}</span>;
}

function PriorityBadge({ level }) {
  return <span className={`priority-badge ${level}`}>{level}</span>;
}

function EmptyState({ title, message }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="queue" size={28} /></div><strong>{title}</strong><p>{message}</p></div>;
}

function Dashboard({ services, setServices, goTo }) {
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

const blankForm = { name: '', description: '', expectedDuration: '', priority: 'medium' };

function ServiceManagement({ services, setServices }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(blankForm);
  const [errors, setErrors] = React.useState({});

  function openCreate() {
    setEditingId(null);
    setForm(blankForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(service) {
    setEditingId(service.id);
    setForm({ name: service.name, description: service.description, expectedDuration: String(service.expectedDuration), priority: service.priority });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Service name is required.';
    else if (form.name.trim().length > 100) nextErrors.name = 'Service name must be 100 characters or fewer.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    const duration = Number(form.expectedDuration);
    if (!form.expectedDuration) nextErrors.expectedDuration = 'Expected duration is required.';
    else if (!Number.isInteger(duration) || duration < 1 || duration > 480) nextErrors.expectedDuration = 'Enter a whole number from 1 to 480.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function save(event) {
    event.preventDefault();
    if (!validate()) return;
    const value = {
      name: form.name.trim(),
      description: form.description.trim(),
      expectedDuration: Number(form.expectedDuration),
      priority: form.priority,
    };
    if (editingId) {
      setServices((current) => current.map((service) => service.id === editingId ? { ...service, ...value } : service));
    } else {
      setServices((current) => [...current, { id: `svc-${crypto.randomUUID()}`, ...value, isOpen: false, queue: [] }]);
    }
    setModalOpen(false);
  }

  function remove(service) {
    if (window.confirm(`Delete “${service.name}”? This also removes its mock queue data.`)) {
      setServices((current) => current.filter((item) => item.id !== service.id));
    }
  }

  function toggle(service) {
    setServices((current) => current.map((item) => item.id === service.id ? { ...item, isOpen: !item.isOpen } : item));
  }

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Service Management"
        description="Create, edit, open, and close the services available to users."
        action={<button className="button primary" onClick={openCreate}><Icon name="plus" size={18} /> Add service</button>}
      />
      <section className="panel table-panel">
        <div className="responsive-table-wrap">
          <table className="data-table">
            <thead><tr><th>Service</th><th>Duration</th><th>Priority</th><th>Status</th><th>Queue</th><th className="actions-column">Actions</th></tr></thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td><div className="service-cell"><strong>{service.name}</strong><span>{service.description}</span></div></td>
                  <td>{service.expectedDuration} min</td>
                  <td><PriorityBadge level={service.priority} /></td>
                  <td><StatusBadge open={service.isOpen} /></td>
                  <td>{service.queue.length}</td>
                  <td><div className="row-actions">
                    <button className={`button small ${service.isOpen ? 'danger-outline' : 'primary'}`} onClick={() => toggle(service)}>{service.isOpen ? 'Close' : 'Open'}</button>
                    <button className="icon-button" onClick={() => openEdit(service)} title="Edit service" aria-label={`Edit ${service.name}`}><Icon name="edit" size={17} /></button>
                    <button className="icon-button danger" onClick={() => remove(service)} title="Delete service" aria-label={`Delete ${service.name}`}><Icon name="trash" size={17} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <Modal title={editingId ? 'Edit service' : 'Create service'} onClose={() => setModalOpen(false)} footer={<><button className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" onClick={save}>{editingId ? 'Save changes' : 'Create service'}</button></>}>
          <form className="form-grid" onSubmit={save} noValidate>
            <label className="field full"><span>Service name <em>*</em></span><input value={form.name} maxLength={100} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(errors.name)} /><small className={errors.name ? 'error-text' : ''}>{errors.name || `${form.name.length}/100 characters`}</small></label>
            <label className="field full"><span>Description <em>*</em></span><textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} aria-invalid={Boolean(errors.description)} /><small className="error-text">{errors.description}</small></label>
            <label className="field"><span>Expected duration (minutes) <em>*</em></span><input type="number" min="1" max="480" step="1" value={form.expectedDuration} onChange={(event) => setForm({ ...form, expectedDuration: event.target.value })} aria-invalid={Boolean(errors.expectedDuration)} /><small className="error-text">{errors.expectedDuration}</small></label>
            <label className="field"><span>Priority level <em>*</em></span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          </form>
        </Modal>
      )}
    </>
  );
}

function QueueManagement({ services, setServices, initialServiceId }) {
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

export default function App() {
  const [page, setPage] = React.useState('dashboard');
  const [selectedServiceId, setSelectedServiceId] = React.useState(null);
  const [services, setServices] = React.useState(loadServices);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  function goTo(nextPage, serviceId = null) {
    setSelectedServiceId(serviceId);
    setPage(nextPage);
  }

  const notifications = services.filter((service) => service.isOpen && service.queue.length >= 3).length;

  return (
    <Layout page={page} onPageChange={goTo} notifications={notifications}>
      {page === 'dashboard' && <Dashboard services={services} setServices={setServices} goTo={goTo} />}
      {page === 'services' && <ServiceManagement services={services} setServices={setServices} />}
      {page === 'queues' && <QueueManagement services={services} setServices={setServices} initialServiceId={selectedServiceId} />}
    </Layout>
  );
}
