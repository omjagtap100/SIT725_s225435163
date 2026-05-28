const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = process.env.JWT_SECRET || "volunteerhub-test-secret";

const createApp = require("../app");
const User = require("../models/user.model");

let app;
let mongoServer;

async function registerAndLogin(overrides = {}) {
  const user = {
    name: "Integration User",
    email: "integration.user@example.com",
    password: "Pass@12345",
    role: "Volunteer",
    ...overrides
  };

  await request(app).post("/auth/register").send(user).expect(201);

  const loginResponse = await request(app)
    .post("/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(200);

  return { token: loginResponse.body.token, user };
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "volunteerhub-tests" });
  app = createApp();
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.afterEach(async () => {
  await User.deleteMany({});
});

test("GET /auth/profile returns the authenticated user profile", async () => {
  const { token, user } = await registerAndLogin({
    name: "Profile Reader",
    email: "profile.reader@example.com"
  });

  const response = await request(app)
    .get("/auth/profile")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.ok(response.body._id);
  assert.equal(response.body.name, user.name);
  assert.equal(response.body.email, user.email.toLowerCase());
  assert.equal(response.body.role, user.role);
  assert.equal(response.body.phone, "");
  assert.equal(response.body.bio, "");
  assert.deepEqual(response.body.skills, []);
});

test("PATCH /auth/profile updates profile fields and persists them", async () => {
  const { token, user } = await registerAndLogin({
    name: "Initial Name",
    email: "profile.writer@example.com"
  });

  const payload = {
    name: "Updated Volunteer",
    phone: "0412 345 678",
    bio: "Available for weekend community work.",
    skills: ["First Aid", "Teamwork"]
  };

  const updateResponse = await request(app)
    .patch("/auth/profile")
    .set("Authorization", `Bearer ${token}`)
    .send(payload)
    .expect(200);

  assert.equal(updateResponse.body.name, payload.name);
  assert.equal(updateResponse.body.phone, payload.phone);
  assert.equal(updateResponse.body.bio, payload.bio);
  assert.deepEqual(updateResponse.body.skills, payload.skills);

  const storedUser = await User.findOne({ email: user.email.toLowerCase() }).lean();
  assert.equal(storedUser.name, payload.name);
  assert.equal(storedUser.phone, payload.phone);
  assert.equal(storedUser.bio, payload.bio);
  assert.deepEqual(storedUser.skills, payload.skills);

  const profileResponse = await request(app)
    .get("/auth/profile")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(profileResponse.body.name, payload.name);
  assert.equal(profileResponse.body.phone, payload.phone);
  assert.equal(profileResponse.body.bio, payload.bio);
  assert.deepEqual(profileResponse.body.skills, payload.skills);
});

test("PATCH /auth/profile rejects unknown fields", async () => {
  const { token } = await registerAndLogin({
    email: "profile.invalid@example.com"
  });

  const response = await request(app)
    .patch("/auth/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ location: "Melbourne" })
    .expect(400);

  assert.equal(response.body.message, "Unknown field: location");
});

test("GET /auth/profile requires authentication", async () => {
  const response = await request(app).get("/auth/profile").expect(401);

  assert.equal(response.body.message, "Missing token");
});
