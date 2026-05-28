const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Event = require("../models/event.model");
const Application = require("../models/application.model");
const { sendNotificationEmail } = require("./notification.service");
const cache = require("./cache.service");
const CREATE_KEYS = ["name", "email", "password", "role"];

function buildError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function assertOnlyKeys(payload, allowed) {
  if (!payload || typeof payload !== "object") return "Request body must be an object";
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) return `Unknown field: ${key}`;
  }
  return null;
}

async function register(payload) {
  const unknown = assertOnlyKeys(payload, new Set(CREATE_KEYS));
  if (unknown) throw buildError(unknown, 400);

  const { name, email, password, role } = payload;
  if (!name || !email || !password || !role) {
    throw buildError("name, email, password, role are required", 400);
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (existing) throw buildError("Email already exists", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    role
  });
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

async function login(payload, jwtSecret) {
  const { email, password } = payload;
  if (!email || !password) throw buildError("email and password are required", 400);

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw buildError("Invalid credentials", 401);
  if (!user.isActive) throw buildError("User account is deactivated", 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw buildError("Invalid credentials", 401);

  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name
    },
    jwtSecret,
    { expiresIn: "24h" }
  );
}
async function requestPasswordReset(email) {
  if (!email) throw buildError("email is required", 400);
  const user = await User.findOne({ email: String(email).toLowerCase() });
  const message = "If an account exists, a reset token was sent to that email.";
  if (!user || !user.isActive) return { message };
 
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
 
  await sendNotificationEmail(
    user.email,
    "VolunteerHub password reset",
    `Hi ${user.name},\n\nUse this token within 1 hour on the login page:\n\n${token}\n\nVolunteerHub`
  );
 
  const out = { message };
  if (process.env.NODE_ENV !== "production") out.devToken = token;
  return out;
}
 
async function resetPassword(payload) {
  const { token, password } = payload;
  if (!token || !password) throw buildError("token and password are required", 400);
  if (String(password).length < 8) throw buildError("password must be at least 8 characters", 400);
 
  const user = await User.findOne({
    resetToken: String(token),
    resetTokenExpiry: { $gt: new Date() }
  });
  if (!user) throw buildError("Invalid or expired reset token", 400);
 
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();
  return { message: "Password updated. You can log in now." };
}
 
async function deleteOrganization(orgId, user) {
  if (user.role !== "Admin") throw buildError("Forbidden", 403);
  const org = await Organization.findById(orgId);
  if (!org) throw buildError("Organization not found", 404);
 
  const events = await Event.find({ organizationId: String(orgId) }).select("_id").lean();
  const eventIds = events.map((e) => String(e._id));
  if (eventIds.length) {
    await Application.deleteMany({ eventId: { $in: eventIds } });
    await Event.deleteMany({ _id: { $in: eventIds } });
  }
  await Organization.findByIdAndDelete(orgId);
  await cache.invalidateEvents();
  return { deleted: true, organizationId: String(orgId), eventsRemoved: eventIds.length };
}
 
async function setUserActive(userId, isActive) {
  const updated = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).lean();
  if (!updated) throw buildError("User not found", 404);
  return updated;
}
async function createOrganization(userId, payload) {
  const { name, description, category, address, contactEmail } = payload;
  if (!name || !description || !category || !address || !contactEmail) {
    throw buildError("name, description, category, address, contactEmail are required", 400);
  }
  return Organization.create({ name, description, category, address, contactEmail, managerUserId: userId, status: "Pending" });
}
async function reviewOrganization(orgId, status) {
  if (!["Approved", "Rejected"].includes(status)) throw buildError("status must be Approved or Rejected", 400);
  const updated = await Organization.findByIdAndUpdate(orgId, { status }, { new: true }).lean();
  if (!updated) throw buildError("Organization not found", 404);
  return updated;
}

async function updateOrganization(orgId, userId, payload) {
  const org = await Organization.findById(orgId);
  if (!org) throw buildError("Organization not found", 404);
  if (String(org.managerUserId) !== String(userId)) throw buildError("Forbidden for this organization", 403);
  if (org.status !== "Approved") throw buildError("Organization must be approved first", 400);
  const allowed = ["name", "description", "category", "address", "contactEmail"];
  const unknown = assertOnlyKeys(payload, new Set(allowed));
  if (unknown) throw buildError(unknown, 400);
  org.set(payload);
  await org.save();
  return org.toObject();
}

async function getOrganizations() {
  return Organization.find({}).sort({ createdAt: -1 }).lean();
}
async function getMyOrganization(user) {
  if (!user || !user.id) throw buildError("Unauthorized", 401);
  if (user.role !== "OrganisationManager") throw buildError("Only organisation managers can access this", 403);
  return Organization.findOne({ managerUserId: user.id }).sort({ createdAt: -1 }).lean();
}
async function updateProfile(userId, payload) {
  const allowed = ["name", "phone", "bio", "skills"];
  const unknown = assertOnlyKeys(payload, new Set(allowed));
  if (unknown) throw buildError(unknown, 400);
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
      ...(payload.skills !== undefined ? { skills: payload.skills } : {})
    },
    { new: true }
  ).lean();
  if (!updated) throw buildError("User not found", 404);
  return updated;
}
async function getProfile(userId) {
  const user = await User.findById(userId)
    .select("_id name email role phone bio skills")
    .lean();
  if (!user) throw buildError("User not found", 404);
  return user;
}

module.exports = {
  register,
  login,
  createOrganization,
  requestPasswordReset,
  resetPassword,
 deleteOrganization,
 reviewOrganization,
  updateOrganization,
  getOrganizations,
  setUserActive,
  getMyOrganization,
  updateProfile,
  getProfile
}
