// useFormValidation.js
// A reusable React hook that wires the shared validators into any form.
// Teammates import this, pass in initial values + a schema, and get back
// everything needed to render inputs, show errors, and block invalid submits.

import { useState } from "react";
import { validateField } from "./validators";

// initialValues: an object like { email: "", password: "" }
// schema: an object mapping each field to an array of rules,
//         like { email: [validators.required, validators.email] }
export function useFormValidation(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Call on every keystroke. Re-validates a field only after it's been touched,
  // so users don't see errors before they've interacted with a field.
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(value, schema[field]),
      }));
    }
  };

  // Call when a field loses focus. Marks it touched and validates it.
  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(values[field], schema[field]),
    }));
  };

  // Call on submit. Validates every field, reveals all errors, and returns
  // true only if the whole form is valid.
  const validateAll = () => {
    const newErrors = {};
    for (const field in schema) {
      newErrors[field] = validateField(values[field], schema[field]);
    }
    setErrors(newErrors);
    setTouched(
      Object.keys(schema).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return Object.values(newErrors).every((e) => e === null);
  };

  // Optional: reset the form back to its initial state after a successful submit.
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, validateAll, reset };
}
