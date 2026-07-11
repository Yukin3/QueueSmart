// ServiceForm.jsx
// Demo of the Service Management screen (Admin) wired to the shared validation.
// This is the proof-of-work file: it shows required fields, a max-length limit,
// a numeric input, and a fixed-option dropdown all validating on blur + submit.

import { useState } from "react";
import { useFormValidation } from "./useFormValidation";
import { validators } from "./validators";
import "./ServiceForm.css";

// The validation schema for this form. Each field lists the rules it must pass.
const schema = {
  serviceName: [validators.required, validators.maxLength(100)],
  description: [validators.required],
  duration: [validators.required, validators.positiveNumber],
  priority: [validators.required, validators.oneOf(["low", "medium", "high"])],
};

export default function ServiceForm() {
  const { values, errors, touched, handleChange, handleBlur, validateAll, reset } =
    useFormValidation(
      { serviceName: "", description: "", duration: "", priority: "" },
      schema
    );

  const [saved, setSaved] = useState(null);

  const handleSubmit = () => {
    setSaved(null);
    if (validateAll()) {
      // In the real app a teammate saves this to mock data / state here.
      setSaved({ ...values });
      reset();
    }
  };

  // Small helper so each field renders the same way: input + inline error + red border.
  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="sf-card">
      <h2 className="sf-title">Create Service</h2>
      <p className="sf-subtitle">Add a service users can queue for.</p>

      {/* Service Name — required, max 100 chars */}
      <div className="sf-field">
        <label className="sf-label" htmlFor="serviceName">Service name</label>
        <input
          id="serviceName"
          type="text"
          value={values.serviceName}
          onChange={handleChange("serviceName")}
          onBlur={handleBlur("serviceName")}
          className={showError("serviceName") ? "sf-input sf-input--error" : "sf-input"}
          placeholder="e.g. Passport renewal"
          maxLength={120} /* soft cap in the UI; validator enforces 100 */
        />
        <div className="sf-meta">
          {showError("serviceName") ? (
            <span className="sf-error">{errors.serviceName}</span>
          ) : (
            <span className="sf-hint">{values.serviceName.length}/100</span>
          )}
        </div>
      </div>

      {/* Description — required */}
      <div className="sf-field">
        <label className="sf-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={handleChange("description")}
          onBlur={handleBlur("description")}
          className={showError("description") ? "sf-input sf-input--error" : "sf-input"}
          placeholder="What this service is for"
        />
        {showError("description") && (
          <span className="sf-error">{errors.description}</span>
        )}
      </div>

      {/* Expected Duration — required, positive number */}
      <div className="sf-field">
        <label className="sf-label" htmlFor="duration">Expected duration (minutes)</label>
        <input
          id="duration"
          type="number"
          min="1"
          value={values.duration}
          onChange={handleChange("duration")}
          onBlur={handleBlur("duration")}
          className={showError("duration") ? "sf-input sf-input--error" : "sf-input"}
          placeholder="e.g. 15"
        />
        {showError("duration") && (
          <span className="sf-error">{errors.duration}</span>
        )}
      </div>

      {/* Priority Level — required, one of low/medium/high */}
      <div className="sf-field">
        <label className="sf-label" htmlFor="priority">Priority level</label>
        <select
          id="priority"
          value={values.priority}
          onChange={handleChange("priority")}
          onBlur={handleBlur("priority")}
          className={showError("priority") ? "sf-input sf-input--error" : "sf-input"}
        >
          <option value="">Select priority…</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {showError("priority") && (
          <span className="sf-error">{errors.priority}</span>
        )}
      </div>

      <button className="sf-button" onClick={handleSubmit}>
        Save service
      </button>

      {/* Confirmation after a valid submit — proves the form only saves clean data. */}
      {saved && (
        <div className="sf-success">
          Saved: <strong>{saved.serviceName}</strong> · {saved.duration} min ·{" "}
          {saved.priority} priority
        </div>
      )}
    </div>
  );
}
