const mongoose = require("mongoose");




const userProfileModel = new mongoose.Schema(
    {
        accountId: {
            type: String,
            required: true,
            unique: true,
        },
        credentialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserCredentials",
            required: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        preferences: {
            notifsEnabled: {
                type: Boolean,
                default: true,
            },
            contactMethod: {
                type: String,
                enum: ["email", "sms", "push", "none"],
                default: "email",
            },
        },
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("UserProfile", userProfileModel);