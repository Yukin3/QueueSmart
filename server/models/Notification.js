const mongoose = require("mongoose");




const notificationModel = new mongoose.Schema(
    {
        notificationId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ["user", "admin"],
            default: "user",
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        type: {
            type: String,
            required: true,
            enum: ["queue-joined", "queue-status", "service-update"],
        },
        tone: {
            type: String,
            enum: ["info", "success", "warning", "error"],
            default: "info",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("Notification", notificationModel);
