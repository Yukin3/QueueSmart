const mongoose = require("mongoose")



//TODO: fill in model schema
const userCredModel = new mongoose.Schema(
    {
        email: {},
        passwordHash: {},
        role: {},
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model("UserCreds", userCredModel)