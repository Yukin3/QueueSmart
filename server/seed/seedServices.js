const Service = require("../models/Service");



async function upsertService(serviceData) {
    await Service.findOneAndUpdate(
        {
            name: serviceData.name, 
            organizationId: serviceData.organizationId
        },
        {
            $set: serviceData,
        },
        {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
        },
    );
}



async function seedServices(params) {
    console.log("Seeding Services..");

    await upsertService({
        organizationId: "org-uh",
        adminId: "admin-001",
        name: "General Help Desk",
        description: "General questions, account help, and basic support.",
        expectedDuration: 12,
        priority: "low",
        isOpen: true,
    });

    await upsertService({
        organizationId: "org-uh",
        adminId: "admin-001",
        name: "Technical Support",
        description: "Password resets, device setup, and software troubleshooting.",
        expectedDuration: 15,
        priority: "medium",
        isOpen: true,
    });

    await upsertService({
        organizationId: "org-uh",
        adminId: "admin-001",
        name: "Academic Advising",
        description: "Degree planning, registration, and graduation questions.",
        expectedDuration: 30,
        priority: "medium",
        isOpen: true,
    });

    console.log("Services seeded successfully!");
}


module.exports = seedServices;