const bcrypt = require("bcryptjs")

const UserCredentials = require("../models/UserCredentials");
const UserProfile = require("../models/UserProfile");


async function upsertUser({ accountId, email, password, role, adminType, organizationId, fullName, phone = "" }) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const credentials = await UserCredentials.findOneAndUpdate(
            { accountId },
            {
            $set: {
                accountId,
                email,
                passwordHash,
                role,
                adminType,
                organizationId,
            },
            },
            {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            }
    );

    await UserProfile.findOneAndUpdate(
        { accountId },
        {
        $set: {
            accountId,
            credentialId: credentials._id,
            fullName,
            email,
            phone,
            preferences: {
            notifsEnabled: true,
            contactMethod: "email",
            },
        },
        },
        {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        }
    )



}



async function seedUsers(params) {
    console.log("Seeding Users..");

    await upsertUser({
        accountId: "admin-001",
        email: "mmokut@qs.com",
        password: "queuesmart",
        role: "admin",
        adminType: "org_admin",
        organizationId: "org-uh",
        fullName: "Admin Mmokut",
    });

    await upsertUser({
        accountId: "admin-002",
        email: "grace@qs.com",
        password: "queuesmart",
        role: "admin",
        adminType: "org_admin",
        organizationId: "org-uh",
        fullName: "Admin Grace",
    });

    await upsertUser({
        accountId: "admin-003",
        email: "nhien@qs.com",
        password: "queuesmart",
        role: "admin",
        adminType: "org_admin",
        organizationId: "org-uh",
        fullName: "Admin Nhien",
    });

    await upsertUser({
        accountId: "admin-004",
        email: "martin@qs.com",
        password: "queuesmart",
        role: "admin",
        adminType: "org_admin",
        organizationId: "org-uh",
        fullName: "Admin Martin",
    });

    await upsertUser({
        accountId: "user-001",
        email: "aj001@qs.com",
        password: "queuesmart",
        role: "user",
        adminType: null,
        organizationId: "org-uh",
        fullName: "Avery Johnson",
        phone: "123-456-7890",
    });

    console.log("Users seeded successfully!")
}



module.exports = seedUsers;