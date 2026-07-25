const {
    validateServiceInput,
    validateLoginInput
} = require("../utils/validation");

describe("validateServiceInput", () => {
    const validService = {
        name: "Academic Advising",
        description: "Meet with an academic advisor",
        expectedDuration: 20,
        priority: "medium"
    };

    test("returns no errors for a valid service", () => {
        expect(validateServiceInput(validService)).toEqual([]);
    });

    test("rejects a missing service name", () => {
        const service = {
            ...validService,
            name: ""
        };

        expect(validateServiceInput(service))
            .toContain("Service name is required");
    });

    test("rejects a service name containing only spaces", () => {
        const service = {
            ...validService,
            name: "   "
        };

        expect(validateServiceInput(service))
            .toContain("Service name is required");
    });

    test("rejects a service name longer than 100 characters", () => {
        const service = {
            ...validService,
            name: "A".repeat(101)
        };

        expect(validateServiceInput(service))
            .toContain("Service name cannot exceed 100 characters");
    });

    test("rejects a missing description", () => {
        const service = {
            ...validService,
            description: ""
        };

        expect(validateServiceInput(service))
            .toContain("Description is required");
    });

    test("rejects a description longer than 500 characters", () => {
        const service = {
            ...validService,
            description: "A".repeat(501)
        };

        expect(validateServiceInput(service))
            .toContain("Description cannot exceed 500 characters");
    });

    test("rejects expected duration provided as text", () => {
        const service = {
            ...validService,
            expectedDuration: "twenty"
        };

        expect(validateServiceInput(service))
            .toContain("Expected duration must be a valid number");
    });

    test("rejects a negative expected duration", () => {
        const service = {
            ...validService,
            expectedDuration: -5
        };

        expect(validateServiceInput(service))
            .toContain("Expected duration must be greater than zero");
    });

    test("rejects an invalid priority", () => {
        const service = {
            ...validService,
            priority: "urgent"
        };

        expect(validateServiceInput(service))
            .toContain("Priority must be low, medium, or high");
    });

    test("reports multiple invalid fields together", () => {
        const service = {
            name: "",
            description: "",
            expectedDuration: -10,
            priority: "urgent"
        };

        const errors = validateServiceInput(service);

        expect(errors).toHaveLength(4);
        expect(errors).toContain("Service name is required");
        expect(errors).toContain("Description is required");
        expect(errors).toContain(
            "Expected duration must be greater than zero"
        );
        expect(errors).toContain(
            "Priority must be low, medium, or high"
        );
    });

    test("rejects null service data without crashing", () => {
        expect(validateServiceInput(null))
            .toEqual(["Service data must be an object"]);
    });
});

describe("validateLoginInput", () => {
    test("returns no errors for valid login information", () => {
        const credentials = {
            email: "admin@queuesmart.com",
            password: "password123"
        };

        expect(validateLoginInput(credentials)).toEqual([]);
    });

    test("rejects a missing email", () => {
        const credentials = {
            password: "password123"
        };

        expect(validateLoginInput(credentials))
            .toContain("Email is required");
    });

    test("rejects an invalid email", () => {
        const credentials = {
            email: "not-an-email",
            password: "password123"
        };

        expect(validateLoginInput(credentials))
            .toContain("Email must be valid");
    });

    test("rejects a missing password", () => {
        const credentials = {
            email: "admin@queuesmart.com"
        };

        expect(validateLoginInput(credentials))
            .toContain("Password is required");
    });

    test("rejects a password shorter than 6 characters", () => {
        const credentials = {
            email: "admin@queuesmart.com",
            password: "123"
        };

        expect(validateLoginInput(credentials))
            .toContain("Password must contain at least 6 characters");
    });

    test("rejects null login data without crashing", () => {
        expect(validateLoginInput(null))
            .toEqual(["Login data must be an object"]);
    });
});