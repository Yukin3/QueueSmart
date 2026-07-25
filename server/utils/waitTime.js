function estimateWaitTime(position, expectedDuration) {
    if (!Number.isInteger(position)) {
        throw new TypeError("Position must be an integer");
    }

    if (position < 0) {
        throw new RangeError("Position cannot be negative");
    }

    if (
        typeof expectedDuration !== "number" ||
        !Number.isFinite(expectedDuration)
    ) {
        throw new TypeError("Expected duration must be a valid number");
    }

    if (expectedDuration <= 0) {
        throw new RangeError("Expected duration must be greater than zero");
    }

    return position * expectedDuration;
}

module.exports = {
    estimateWaitTime
};