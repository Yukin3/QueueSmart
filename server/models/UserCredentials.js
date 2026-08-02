const mongoose = require("mongoose");




const userCredentialsModel = new mongoose.Schema(
    {
        accountId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ["user", "admin"],
        },
        adminType: {
            type: String,
            enum: ["org_admin", "service_admin", null],
            default: null,
        },
        organizationId: {
            type: String,
            required: true,
            default: "org-uh",
        },
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("UserCredentials", userCredentialsModel);