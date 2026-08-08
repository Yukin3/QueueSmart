const mongoose = require("mongoose");

const queueEntryModel = new mongoose.Schema(
    {
        serviceId: {
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

        joinedAt: {
            type: Date,
            default: Date.now,
        },

        status: {
            type: String,
            enum: ["waiting", "serving", "served", "left", "removed"],
            default: "waiting",
        },

        type: {
            type: String,
            enum: ["walk-in", "appointment"],
            default: "walk-in",
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

        manualOrder: {
            type: Number,
            default: null,
        },

        almostNotified: {
            type: Boolean,
            default: false,
        },

        servingStartedAt: {
            type: Date,
            default: null,
        },

        leftAt: {
            type: Date,
            default: null,
        },

        removedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("QueueEntry", queueEntryModel);