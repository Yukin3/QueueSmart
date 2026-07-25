const { estimateWaitTime } = require("../utils/waitTime");

describe("estimateWaitTime", () => {
    test("returns 0 when the user is next in line", () => {
        expect(estimateWaitTime(0, 15)).toBe(0);
    });

    test("calculates wait time using position times duration", () => {
        expect(estimateWaitTime(3, 10)).toBe(30);
    });

    test("allows decimal service durations", () => {
        expect(estimateWaitTime(4, 7.5)).toBe(30);
    });

    test("throws an error when position is negative", () => {
        expect(() => estimateWaitTime(-1, 10))
            .toThrow("Position cannot be negative");
    });

    test("throws an error when position is not an integer", () => {
        expect(() => estimateWaitTime(2.5, 10))
            .toThrow("Position must be an integer");
    });

    test("throws an error when expected duration is zero", () => {
        expect(() => estimateWaitTime(3, 0))
            .toThrow("Expected duration must be greater than zero");
    });

    test("throws an error when expected duration is negative", () => {
        expect(() => estimateWaitTime(3, -10))
            .toThrow("Expected duration must be greater than zero");
    });

    test("throws an error when expected duration is text", () => {
        expect(() => estimateWaitTime(3, "ten"))
            .toThrow("Expected duration must be a valid number");
    });

    test("throws an error when expected duration is missing", () => {
        expect(() => estimateWaitTime(3))
            .toThrow("Expected duration must be a valid number");
    });
});