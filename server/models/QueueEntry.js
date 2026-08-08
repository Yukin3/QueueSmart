const mongoose = require("mongoose");




const queueEntryModel = new mongoose.Schema(
    {
        entryId: {
            type: String,
            required: true,
            unique: true,
        },
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
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["waiting", "serving", "left", "removed"],
            default: "waiting",
        },
        type: {
            type: String,
            required: true,
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
        //set by admin reorder; intentionally has no default so it stays
        //undefined for un-reordered entries (see sortQueueEntries)
        manualOrder: {
            type: Number,
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
