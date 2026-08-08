const mongoose = require("mongoose");




const queueHistoryModel = new mongoose.Schema(
    {
        historyId: {
            type: String,
            required: true,
            unique: true,
        },
        entryId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        serviceId: {
            type: String,
            required: true,
        },
        serviceName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null,
        },
        outcome: {
            type: String,
            required: true,
            enum: ["served", "left", "removed"],
        },
        type: {
            type: String,
            required: true,
            enum: ["walk-in", "appointment"],
        },
        priority: {
            type: String,
            enum: ["low", "normal", "high", "urgent"],
            default: "normal",
        },
        appointmentTime: {
            type: Date,
            default: null,
        },
        joinedAt: {
            type: Date,
            required: true,
        },
        endedAt: {
            type: Date,
            required: true,
        },
        waitDurationMinutes: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("QueueHistory", queueHistoryModel);
