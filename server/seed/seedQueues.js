const Queue = require("../models/Queue");
const Service = require("../models/Service");

async function seedQueues() {
  console.log("Seeding Queues..");

  const services = await Service.find({});

  for (const service of services) {
    await Queue.findOneAndUpdate(
      { serviceId: service._id.toString() },
      {
        $set: {
          queueId: `queue-${service._id.toString()}`,
          serviceId: service._id.toString(),
          serviceName: service.name,
          organizationId: service.organizationId || "org-uh",
          status: service.isOpen ? "open" : "closed",
          averageServiceMinutes: service.expectedDuration,
          waitTimeMethod: "basic",
          smartSettings: {
            priorityWeightEnabled: true,
            appointmentWindowMinutes: 25,
            movingAverageSampleSize: 5,
          },
          createdDate: service.createdAt || new Date(),
        },
        $setOnInsert: {
          stats: {
            totalJoined: 0,
            totalServed: 0,
            totalLeft: 0,
            lastActivityAt: null,
          },
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );
  }

  console.log("Queues seeded successfully!");
}

module.exports = seedQueues;