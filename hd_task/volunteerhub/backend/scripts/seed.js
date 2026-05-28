
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Event = require("../models/event.model");
const Application=require("../models/application.model")
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required to run seed.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected for seeding (Sprint 1)");

  await Application.deleteMany({});
  await Event.deleteMany({});
  await Organization.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("Pass@12345", 10);

  const users = await User.insertMany([
    {
      name: "Admin User",
      email: "admin@volunteerhub.local",
      passwordHash,
      role: "Admin"
    },
    {
      name: "Org Manager",
      email: "manager@volunteerhub.local",
      passwordHash,
      role: "OrganisationManager"
    },
    {
      name: "Demo Volunteer",
      email: "demo.volunteer@volunteerhub.local",
      passwordHash,
      role: "Volunteer"
    }
  ]);

  const manager = users.find((u) => u.role === "OrganisationManager");
  const volunteer = users.find((u) => u.role === "Volunteer");
  const today = new Date().toISOString().slice(0, 10);
  const org = await Organization.create({
    name: "Community Helpers",
    description: "Local community volunteer organization",
    category: "Community",
    address: "Melbourne VIC",
    contactEmail: "contact@communityhelpers.local",
    managerUserId: String(manager._id),
    status: "Approved"
  });

  const cleanUpEvent = await Event.create({
    title: "Community Clean-up Day",
    description: "Help clean parks and public spaces in the local area.",
    date: today,
    startTime: "09:00",
    endTime: "13:00",
    location: "Melbourne CBD",
    category: "Environment",
    maxVolunteers: 30,
    roles: [
      {
        roleTitle: "General Volunteer",
        description: "General clean-up support",
        requiredSkills: ["Teamwork"],
        capacity: 20
      },
      {
        roleTitle: "Team Lead",
        description: "Lead a small group",
        requiredSkills: ["Leadership", "First aid"],
        capacity: 5
      }
    ],
    createdBy: String(manager._id),
    organizationId: String(org._id),
    status: "Published"
  });
  await Application.create({
    eventId: String(cleanUpEvent._id),
    roleTitle: "General Volunteer",
    volunteerId: String(volunteer._id),
    volunteerName: volunteer.name,
    status: "Accepted"
  });
  console.log("Seed completed.");
  console.log("Admin: admin@volunteerhub.local / Pass@12345");
  console.log("Manager: manager@volunteerhub.local / Pass@12345");
  console.log("Volunteer: demo.volunteer@volunteerhub.local / Pass@12345");

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch (_e) {
     
    }
    process.exit(1);
  });
