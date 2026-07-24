import React from "react";
import Modal from "../components/Modal";
import { Icon } from "../components/Icons";
import {PageHeader, StatusBadge, PriorityBadge, EmptyState} from "../components/Shared";
import { createService, updateService, deleteService } from "../api/servicesApi";



const blankForm = { name: '', description: '', expectedDuration: '', priority: 'medium' };


export default function ServiceManagement({ services, setServices, currentUserAccount }) {  const [modalOpen, setModalOpen] = React.useState(false);
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


async function save(event) {
    event.preventDefault();

    if (!validate()){
     return
    }


    //build service object
    const value = {
    name: form.name.trim(),
    description: form.description.trim(),
    expectedDuration: Number(form.expectedDuration),
    priority: form.priority,
    adminId: currentUserAccount?.id,
    organizationId: currentUserAccount?.organizationId,
    };




    try {
    //if editingID update service    
    if (editingId) { 
        const data = await updateService(editingId, value);

        //replace updated service
        setServices((current) =>
        current.map((service) =>
            service.id === editingId
            ? {
                ...data.service,
                queue: service.queue || [], //preserve queue
                }
            : service
        ));

    } else { //if no editingID make create new service
        const data = await createService(value);

        //add service to curr state
        setServices((current) => [
        ...current,
        {
            ...data.service,
            queue: [], //begin w/ empty queu
        },
        ]);
    }



    //close modal after saving
    setModalOpen(false);
    } catch (error) { 
    
    //shows saving errors
    setErrors(
        error.details || {
        submit: error.error || "Service could not be saved.",
        });
    }
}



async function remove(service) {
    if (!window.confirm(`Delete “${service.name}”? This also removes its queue data.`)) return;

    try {
        await deleteService(service.id);
        
        setServices((current) => current.filter((item) => item.id !== service.id));

    } catch (error) {
        window.alert(error.error || "Failed to delete service.");
    }


  }



async function toggle(service) {
try {
    const data = await updateService(service.id, {isOpen: !service.isOpen }); //handle update request


    //update service local state
    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? {
              ...item,
              ...data.service,
              queue: item.queue || [],
            }
          : item
      )
    );

} catch (error) {
    window.alert(error.error || "Failed to update service status.");
}

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
            {services.length > 0 ? (
              services.map((service) => (
                <tr key={service.id}>
                  <td><div className="service-cell"><strong>{service.name}</strong><span>{service.description}</span></div></td>
                  <td>{service.expectedDuration} min</td>
                  <td><PriorityBadge level={service.priority} /></td>
                  <td><StatusBadge open={service.isOpen} /></td>
                  <td>{service.queue?.length || 0}</td>
                  <td><div className="row-actions">
                    <button className={`button small ${service.isOpen ? 'danger-outline' : 'primary'}`} onClick={() => toggle(service)}>{service.isOpen ? 'Close' : 'Open'}</button>
                    <button className="icon-button" onClick={() => openEdit(service)} title="Edit service" aria-label={`Edit ${service.name}`}><Icon name="edit" size={17} /></button>
                    <button className="icon-button danger" onClick={() => remove(service)} title="Delete service" aria-label={`Delete ${service.name}`}><Icon name="trash" size={17} /></button>
                  </div></td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan="6">
                        <EmptyState
                        title="User currently has no services"
                        message="Add a service to begin managing services and serving queues."
                        />
                    </td>
                </tr>
            )}


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
            {errors.submit && <small className="error-text">{errors.submit}</small>}
          </form>
        </Modal>
      )}
    </>
  );
}
