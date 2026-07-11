// validators.js
// Shared client-side validation rules for QueueSmart (Assignment 2, item 5).
// Each validator returns `true` when the value is valid, or an error message string when it isn't.
// Import these anywhere in the app so every form validates the same way.

export const validators = {
  // Field must not be empty or whitespace-only.
  required: (v) => (v ?? "").toString().trim() !== "" || "This field is required",

  // Must look like an email address (used for the login/registration username).
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? "") || "Enter a valid email address",

  // Minimum character length. Usage: validators.minLength(8)
  minLength: (n) => (v) =>
    (v ?? "").length >= n || `Must be at least ${n} characters`,

  // Maximum character length. Usage: validators.maxLength(100)
  maxLength: (n) => (v) =>
    (v ?? "").length <= n || `Must be ${n} characters or fewer`,

  // Must be a number greater than 0 (used for Expected Duration).
  positiveNumber: (v) =>
    ((v ?? "") !== "" && !isNaN(v) && Number(v) > 0) ||
    "Enter a number greater than 0",

  // Value must be one of a fixed set. Usage: validators.oneOf(["low","medium","high"])
  oneOf: (opts) => (v) =>
    opts.includes(v) || `Choose one of: ${opts.join(", ")}`,
};

// Run a single field's value through a list of rules.
// Returns the first error message found, or null if the value passes every rule.
export function validateField(value, rules) {
  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) return result; // an error message string
  }
  return null; // valid
}
