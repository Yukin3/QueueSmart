const mongoose = require("mongoose")



//TODO: fill in model schema
const userProfileModel = new mongoose.Schema(
    {
        credsID: {},
        fullName: {},
        email: {},
        phone: {},
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("UserProfile", userProfileModel)