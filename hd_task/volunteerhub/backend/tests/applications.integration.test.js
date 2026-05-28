const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
 
process.env.JWT_SECRET = process.env.JWT_SECRET || "volunteerhub-test-secret";
 
const createApp = require("../app");
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
 
async function setupApprovedOrgAndEvent() {
  const adminToken = await registerAndLogin({
    name: "Admin User",
    email: "admin.apps@example.com",
    password: "Pass@12345",
    role: "Admin"
  });
  const managerToken = await registerAndLogin({
    name: "Manager User",
    email: "manager.apps@example.com",
    password: "Pass@12345",
    role: "OrganisationManager"
  });
  const volunteerToken = await registerAndLogin({
    name: "Volunteer User",
    email: "volunteer.apps@example.com",
    password: "Pass@12345",
    role: "Volunteer"
  });
 
  await request(app)
    .post("/auth/organizations")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      name: "Test Org",
      description: "Integration org",
      category: "Community",
      address: "1 Test St",
      contactEmail: "org@example.com"
    })
    .expect(201);
 
  const orgs = await request(app)
    .get("/auth/organizations")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);
  const orgId = orgs.body[0]._id;
 
  await request(app)
    .patch(`/auth/organizations/${orgId}/review`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "Approved" })
    .expect(200);
 
 const today = new Date().toISOString().slice(0, 10);
    const eventPayload = {
    title: "Beach Cleanup",
    description: "Help clean the beach",
    date: today,
    startTime: "09:00",
    endTime: "12:00",
    location: "Geelong",
    category: "Environment",
    maxVolunteers: 20,
    roles: [{ roleTitle: "Helper", description: "Pick up litter", requiredSkills: [], capacity: 5 }]
  };
 
  const eventResponse = await request(app)
    .post("/events")
    .set("Authorization", `Bearer ${managerToken}`)
    .send(eventPayload)
    .expect(201);
 
  return { adminToken, managerToken, volunteerToken, eventId: eventResponse.body._id };
}
 
test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "volunteerhub-apps-tests" });
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
 
test("GET /events returns paginated published events (FR-12)", async () => {
  const { managerToken } = await setupApprovedOrgAndEvent();
 
  for (let i = 2; i <= 12; i += 1) {
    await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: `Event ${i}`,
        description: "More events for pagination",
        date: "2026-07-01",
        startTime: "10:00",
        endTime: "11:00",
        location: "Geelong",
        category: "Community",
        maxVolunteers: 10,
        roles: [{ roleTitle: "Helper", description: "", requiredSkills: [], capacity: 3 }]
      })
      .expect(201);
  }
 
  const page1 = await request(app)
    .get("/events?page=1&limit=5")
    .set("Authorization", `Bearer ${managerToken}`)
    .expect(200);
 
  assert.equal(page1.body.items.length, 5);
  assert.equal(page1.body.page, 1);
  assert.equal(page1.body.limit, 5);
  assert.equal(page1.body.total, 12);
 
  const page3 = await request(app)
    .get("/events?page=3&limit=5")
    .set("Authorization", `Bearer ${managerToken}`)
    .expect(200);
 
  assert.equal(page3.body.items.length, 2);
  assert.equal(page3.body.page, 3);
});
 
test("POST /applications creates a pending application (FR-15)", async () => {
  const { volunteerToken, eventId } = await setupApprovedOrgAndEvent();
 
  const response = await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(201);
 
  assert.equal(response.body.status, "Pending");
  assert.equal(response.body.roleTitle, "Helper");
  assert.equal(response.body.eventId, String(eventId));
});
 
test("POST /applications rejects duplicate applications (FR-16)", async () => {
  const { volunteerToken, eventId } = await setupApprovedOrgAndEvent();
 
  await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(201);
 
  const duplicate = await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(409);
 
  assert.match(duplicate.body.message, /already applied/i);
});
 
test("Manager can list and accept applications (FR-17, FR-18)", async () => {
  const { managerToken, volunteerToken, eventId } = await setupApprovedOrgAndEvent();
 
  const created = await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(201);
 
  const listed = await request(app)
    .get(`/applications/event/${eventId}`)
    .set("Authorization", `Bearer ${managerToken}`)
    .expect(200);
 
  assert.equal(listed.body.length, 1);
  assert.equal(listed.body[0].volunteerName, "Volunteer User");
 
  const accepted = await request(app)
    .patch(`/applications/${created.body._id}/status`)
    .set("Authorization", `Bearer ${managerToken}`)
    .send({ status: "Accepted" })
    .expect(200);
 
  assert.equal(accepted.body.status, "Accepted");
});
test("GET /applications/me/history returns participation summary (FR-21)", async () => {
  const { managerToken, volunteerToken, eventId } = await setupApprovedOrgAndEvent();
 
  const created = await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(201);
 
  await request(app)
    .patch(`/applications/${created.body._id}/status`)
    .set("Authorization", `Bearer ${managerToken}`)
    .send({ status: "Accepted" })
    .expect(200);
 
  await request(app)
    .patch(`/applications/${created.body._id}/check-in`)
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({})
    .expect(200);
 
  const history = await request(app)
    .get("/applications/me/history")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .expect(200);
 
  assert.equal(history.body.summary.totalApplications, 1);
  assert.equal(history.body.summary.completedCheckIns, 1);
  assert.ok(history.body.summary.totalHours > 0);
  assert.equal(history.body.items[0].eventTitle, "Beach Cleanup");
  assert.equal(history.body.items[0].roleTitle, "Helper");
});
 
test("GET /applications/event/:eventId/export returns CSV (FR-22)", async () => {
  const { managerToken, volunteerToken, eventId } = await setupApprovedOrgAndEvent();
 
  await request(app)
    .post("/applications")
    .set("Authorization", `Bearer ${volunteerToken}`)
    .send({ eventId, roleTitle: "Helper" })
    .expect(201);
 
  const csvResponse = await request(app)
    .get(`/applications/event/${eventId}/export`)
    .set("Authorization", `Bearer ${managerToken}`)
    .expect(200);
 
  assert.match(csvResponse.headers["content-type"], /text\/csv/);
  assert.match(csvResponse.text, /Volunteer Name,Email,Role,Status/);
  assert.match(csvResponse.text, /Volunteer User/);
  assert.match(csvResponse.text, /volunteer\.apps@example\.com/);
});