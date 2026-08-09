const { ReturnDocument } = require("mongodb");
const QueueEntry = require("../models/QueueEntry");
const Service = require("../models/Service");

async function seedQueueEntries() {
    console.log("Seeding Queue Entries..");


    const service = await Service.findOne({
        name: "General Help Desk"
    });

    if (!service) {
        throw new Error("General Help Desk service not found.");
    }

    await QueueEntry.findOneAndUpdate(
        {
            entryId:  "entry-001",
        },
        {
            $set: {
                entryId: "entry-001",
        serviceId: service._id.toString(),
        userId: "user-001",
        userName: "Avery Johnson",
        status: "waiting",
        type: "walk-in",
        priority: "normal",
        joinedAt: new Date(),
            },
        },
        {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
        }
    );

    console.log("Queue Entries seeded successfully!");
}

module.exports = seedQueueEntries;