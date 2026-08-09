require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");


const seedServices = require("./seedServices");
const seedUsers = require("./seedUsers");
const seedQueueEntries = require("./seedQueueEntries");

async function runSeeds() {
    try {
        await connectDB();
        console.log("Beginning DB seed:")
        
        //TODO: comment/uncomment seed functions as needed
        await seedServices();
        await seedUsers();
        await seedQueueEntries();

        console.log("Database seeded successfully."); 
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) { //handle seed errors
        console.error("Database seeding failed:", error);
        await mongoose.connection.close();
        process.exit(1)
    }
}

runSeeds();
