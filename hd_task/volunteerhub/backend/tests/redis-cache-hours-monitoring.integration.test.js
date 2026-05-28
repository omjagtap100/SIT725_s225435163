const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = process.env.JWT_SECRET || "volunteerhub-test-secret";
delete process.env.REDIS_URL;

const createApp = require("../app");
const { calculateEventDurationHours } = require("../services/hours.service");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Event = require("../models/event.model");
const Application = require("../models/application.model");

let app;
let mongoServer;

async function registerAndLogin(user) {
  await request(app).post("/auth/register").send(user).expect(201);
  const loginResponse = await request(app)
    .post("/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(200);
  return loginResponse.body.token;
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "volunteerhub-om-tests" });
  app = createApp();
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Event.deleteMany({}),
    Application.deleteMany({})
  ]);
});

test("calculateEventDurationHours computes FR-20 hours", () => {
  assert.equal(calculateEventDurationHours("09:00", "12:30"), 3.5);
  assert.equal(calculateEventDurationHours("09:00", "09:00"), 0);
});

test("GET /health returns monitoring snapshot (NFR-11, NFR-12)", async () => {
  const response = await request(app).get("/health").expect(200);
  assert.equal(response.body.ok, true);
  assert.ok(response.body.uptimeSeconds >= 0);
  assert.ok(response.body.email);
  assert.ok(response.body.requests);
  assert.ok(response.body.cache);
});

test("GET /events uses cache on repeat requests (Redis optional)", async () => {
  const token = await registerAndLogin({
    name: "Cache User",
    email: "cache@example.com",
    password: "Pass@12345",
    role: "Volunteer"
  });

  const managerToken = await registerAndLogin({
    name: "Manager",
    email: "manager.cache@example.com",
    password: "Pass@12345",
    role: "OrganisationManager"
  });
  const adminToken = await registerAndLogin({
    name: "Admin",
    email: "admin.cache@example.com",
    password: "Pass@12345",
    role: "Admin"
  });

  await request(app)
    .post("/auth/organizations")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      name: "Cache Org",
      description: "Test",
      category: "Community",
      address: "1 St",
      contactEmail: "org@example.com"
    })
    .expect(201);

  const orgs = await request(app)
    .get("/auth/organizations")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  await request(app)
    .patch(`/auth/organizations/${orgs.body[0]._id}/review`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "Approved" })
    .expect(200);

  const today = new Date().toISOString().slice(0, 10);
  await request(app)
    .post("/events")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      title: "Cached Event",
      description: "Test",
      date: today,
      startTime: "10:00",
      endTime: "12:00",
      location: "Geelong",
      category: "Test",
      maxVolunteers: 10,
      roles: [{ roleTitle: "Helper", description: "", requiredSkills: [], capacity: 5 }]
    })
    .expect(201);

  const first = await request(app)
    .get("/events?page=1&limit=10")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(first.body.cached, undefined);

  const second = await request(app)
    .get("/events?page=1&limit=10")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(second.body.cached, true);
  assert.equal(second.body.total, 1);
});

test("check-in sets hoursContributed via hours service (FR-20)", async () => {
  const adminToken = await registerAndLogin({
    name: "Admin",
    email: "admin.hours@example.com",
    password: "Pass@12345",
    role: "Admin"
  });
  const managerToken = await registerAndLogin({
    name: "Manager",
    email: "manager.hours@example.com",
    password: "Pass@12345",
    role: "OrganisationManager"
  });
  const volunteerToken = await registerAndLogin({
    name: "Volunteer",
    email: "volunteer.hours@example.com",
    password: "Pass@12345",
    role: "Volunteer"
  });

  await request(app)
    .post("/auth/organizations")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      name: "Hours Org",
      description: "Test",
      category: "Community",
      address: "1 St",
      contactEmail: "hours@example.com"
    })
    .expect(201);

  const orgs = await request(app)
    .get("/auth/organizations")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  await request(app)
    .patch(`/auth/organizations/${orgs.body[0]._id}/review`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "Approved" })
    .expect(200);

  const today = new Date().toISOString().slice(0, 10);
  const event = await request(app)
    .post("/events")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      title: "Hours Event",
      description: "Test",
      date: today,
      startTime: "09:00",
      endTime: "12:00",
      location: "Geelong",
      category: "Test",
      maxVolunteers: 10,
      roles: [{ roleTitle: "Helper", description: "", requiredSkills: [], capacity: 5 }]
    })
    .expect(201);

  const appRow = await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId: event.body._id, roleTitle: "Helper" })
    .expect(201);

  await request(app)
    .patch(`/applications/${appRow.body._id}/status`)
    .set("Authorization", `Bearer ${managerToken}`)
    .send({ status: "Accepted" })
    .expect(200);

  const checkedIn = await request(app)
    .patch(`/applications/${appRow.body._id}/check-in`)
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({})
    .expect(200);

  assert.equal(checkedIn.body.hoursContributed, 3);
});
