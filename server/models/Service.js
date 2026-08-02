const mongoose = require("mongoose")


const serviceModel = new mongoose.Schema(
    {
        organizationId: {
            type: String,
            required: true,
            default: "org-uh",
        },
        adminId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        expectedDuration: {
            type: Number,
            required: true,
            min: 1,
            max: 480,
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        isOpen: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model("Service", serviceModel)