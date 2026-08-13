const QueueHistory = require("../models/QueueHistory");


//minimum completed visits before historical data is trusted over the admin estimate
const MIN_SAMPLE_SIZE = 5;

//only look at the most recent visits so the estimate adapts as a service speeds up or slows down
const RECENT_SAMPLE_LIMIT = 20;


//static estimate: admin-configured duration multiplied by the number of people ahead
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


//average the observed wait of recent completed visits for one service
//returns null when there is not enough history to be meaningful
async function getHistoricalAverage(serviceId) {
    const recent = await QueueHistory.find({
        serviceId,
        outcome: "served",
    })
        .sort({ endedAt: -1 })
        .limit(RECENT_SAMPLE_LIMIT);

    if (recent.length < MIN_SAMPLE_SIZE) {
        return { average: null, sampleSize: recent.length };
    }

    const total = recent.reduce(
        (sum, record) => sum + record.waitDurationMinutes,
        0
    );

    return {
        average: total / recent.length,
        sampleSize: recent.length,
    };
}


//smart estimate: uses observed history when available, falls back to the static estimate otherwise
async function estimateSmartWaitTime(position, service) {
    const serviceId = service._id ? service._id.toString() : service.id;

    const { average, sampleSize } = await getHistoricalAverage(serviceId);

    //not enough completed visits yet - fall back to the admin's configured duration
    if (average === null) {
        return {
            minutes: estimateWaitTime(position, service.expectedDuration),
            basis: "estimated",
            sampleSize,
            perPersonMinutes: service.expectedDuration,
        };
    }

    return {
        minutes: Math.round(position * average),
        basis: "historical",
        sampleSize,
        perPersonMinutes: Math.round(average),
    };
}


module.exports = {
    estimateWaitTime,
    estimateSmartWaitTime,
    getHistoricalAverage,
    MIN_SAMPLE_SIZE,
    RECENT_SAMPLE_LIMIT,
};
