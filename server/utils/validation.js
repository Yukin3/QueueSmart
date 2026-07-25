function validateServiceInput(service) {
    const errors = [];

    if (!service || typeof service !== "object" || Array.isArray(service)) {
        return ["Service data must be an object"];
    }

    if (
        typeof service.name !== "string" ||
        service.name.trim().length === 0
    ) {
        errors.push("Service name is required");
    } else if (service.name.trim().length > 100) {
        errors.push("Service name cannot exceed 100 characters");
    }

    if (
        typeof service.description !== "string" ||
        service.description.trim().length === 0
    ) {
        errors.push("Description is required");
    } else if (service.description.trim().length > 500) {
        errors.push("Description cannot exceed 500 characters");
    }

    if (
        typeof service.expectedDuration !== "number" ||
        !Number.isFinite(service.expectedDuration)
    ) {
        errors.push("Expected duration must be a valid number");
    } else if (service.expectedDuration <= 0) {
        errors.push("Expected duration must be greater than zero");
    }

    const validPriorities = ["low", "medium", "high"];

    if (
        typeof service.priority !== "string" ||
        !validPriorities.includes(service.priority.toLowerCase())
    ) {
        errors.push("Priority must be low, medium, or high");
    }

    return errors;
}

function validateLoginInput(credentials) {
    const errors = [];

    if (
        !credentials ||
        typeof credentials !== "object" ||
        Array.isArray(credentials)
    ) {
        return ["Login data must be an object"];
    }

    if (
        typeof credentials.email !== "string" ||
        credentials.email.trim().length === 0
    ) {
        errors.push("Email is required");
    } else if (!credentials.email.includes("@")) {
        errors.push("Email must be valid");
    }

    if (
        typeof credentials.password !== "string" ||
        credentials.password.length === 0
    ) {
        errors.push("Password is required");
    } else if (credentials.password.length < 6) {
        errors.push("Password must contain at least 6 characters");
    }

    return errors;
}

module.exports = {
    validateServiceInput,
    validateLoginInput
};