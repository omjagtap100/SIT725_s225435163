const Event = require("../models/event.model");
const Organization = require("../models/organization.model");
const Application = require("../models/application.model");
const User = require("../models/user.model");
const { sendNotificationEmail } = require("./notification.service");
const cache = require("./cache.service");
const { publishNotification } = require("./notification-hub.service");

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function validateDateTimeFields({ date, startTime, endTime }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    throw buildError("date must be YYYY-MM-DD", 400);
  }
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null || end <= start) {
    throw buildError("Invalid startTime/endTime (use HH:MM, end after start)", 400);
  }
}

function normalizeRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [{ roleTitle: "General Volunteer", requiredSkills: [], capacity: 10 }];
  }
  return roles.map((role) => {
    if (!role.roleTitle || !role.capacity) {
      throw buildError("Each role requires roleTitle and capacity", 400);
    }
    return {
      roleTitle: String(role.roleTitle).trim(),
      description: role.description ? String(role.description).trim() : "",
      requiredSkills: Array.isArray(role.requiredSkills) ? role.requiredSkills : [],
      capacity: Number(role.capacity)
    };
  });
}

async function resolveOrganizationForManager(user) {
  const org = await Organization.findOne({ managerUserId: user.id }).sort({ createdAt: -1 }).lean();
  if (!org) throw buildError("No organization linked to this manager account", 400);
  if (org.status !== "Approved") {
    throw buildError(`Organization status is ${org.status}. Event creation requires Approved status`, 400);
  }
  return String(org._id);
}

async function attachCapacity(event) {
  const eventId = String(event._id);
  const apps = await Application.find({
    eventId,
    status: { $in: ["Pending", "Accepted"] }
  }).lean();

  const filledByRole = {};
  for (const app of apps) {
    filledByRole[app.roleTitle] = (filledByRole[app.roleTitle] || 0) + 1;
  }

  const roles = (event.roles || []).map((role) => {
    const filled = filledByRole[role.roleTitle] || 0;
    const capacity = Number(role.capacity) || 0;
    return {
      ...role,
      filled,
      remaining: Math.max(0, capacity - filled)
    };
  });

  const totalFilled = Object.values(filledByRole).reduce((sum, n) => sum + n, 0);
  const maxVolunteers = Number(event.maxVolunteers) || 0;

  return {
    ...event,
    roles,
    capacity: {
      maxVolunteers,
      filled: totalFilled,
      remaining: Math.max(0, maxVolunteers - totalFilled)
    }
  };
}

async function createEvent(payload, user) {
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    location,
    category,
    maxVolunteers,
    roles = [],
    organizationId = null
  } = payload;

  if (!title || !description || !date || !startTime || !endTime || !location || !category || !maxVolunteers) {
    throw buildError("Missing required event fields", 400);
  }
  validateDateTimeFields({ date, startTime, endTime });

  let resolvedOrganizationId = organizationId;
  if (user.role === "OrganisationManager") {
    resolvedOrganizationId = await resolveOrganizationForManager(user);
  } else if (resolvedOrganizationId) {
    const org = await Organization.findById(resolvedOrganizationId).lean();
    if (!org) throw buildError("Organization not found", 404);
    if (org.status !== "Approved") throw buildError("Organization must be approved", 400);
  }

  const event = await Event.create({
    title,
    description,
    date,
    startTime,
    endTime,
    location,
    category,
    maxVolunteers: Number(maxVolunteers),
    roles: normalizeRoles(roles),
    createdBy: user.id,
    organizationId: resolvedOrganizationId || null
  });

  await cache.invalidateEvents();
  return event.toObject();
}

async function getAllEvents(query = {}) {
  const cacheKey = cache.eventsListKey(query);
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const filters = { status: "Published" };
  if (query.category) filters.category = query.category;
  if (query.location) filters.location = { $regex: query.location, $options: "i" };
  if (query.startDate || query.endDate) {
    const start = query.startDate || "0000-01-01";
    const end = query.endDate || "9999-12-31";
    filters.date = { $gte: start, $lte: end };
  }

  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Event.find(filters).sort({ date: 1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filters)
  ]);

  const result = { items, page, limit, total };
  await cache.set(cacheKey, result);
  return result;
}

async function getEventById(id) {
  const cacheKey = cache.eventDetailKey(id);
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const event = await Event.findById(id).lean();
  if (!event) throw buildError("Event not found", 404);
  const result = await attachCapacity(event);
  await cache.set(cacheKey, result);
  return result;
}

async function updateEvent(eventId, payload, user) {
  const event = await Event.findById(eventId);
  if (!event) throw buildError("Event not found", 404);
  if (event.status === "Cancelled") throw buildError("Cancelled events cannot be edited", 400);
  if (user.role !== "Admin" && String(event.createdBy) !== String(user.id)) {
    throw buildError("Forbidden", 403);
  }

  const allowed = ["title", "description", "date", "startTime", "endTime", "location", "category", "maxVolunteers", "roles"];
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key)) throw buildError(`Unknown or disallowed field: ${key}`, 400);
  }

  if (payload.roles !== undefined) payload.roles = normalizeRoles(payload.roles);
  if (payload.maxVolunteers !== undefined) payload.maxVolunteers = Number(payload.maxVolunteers);

  event.set(payload);
  validateDateTimeFields({
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime
  });
  await event.save();
  await cache.invalidateEvents();
  return attachCapacity(event.toObject());
}

async function cancelEvent(eventId, user) {
  const event = await Event.findById(eventId);
  if (!event) throw buildError("Event not found", 404);
  if (user.role !== "Admin" && String(event.createdBy) !== String(user.id)) {
    throw buildError("Forbidden", 403);
  }
  if (event.status === "Cancelled") return event.toObject();

  event.status = "Cancelled";
  event.cancelledAt = new Date();
  await event.save();

  const apps = await Application.find({
    eventId: String(event._id),
    status: { $in: ["Pending", "Accepted"] }
  }).lean();

  const volunteerIds = [...new Set(apps.map((app) => app.volunteerId))];
  const users = await User.find({ _id: { $in: volunteerIds } }).select("email name").lean();
  const emailById = Object.fromEntries(users.map((u) => [String(u._id), u.email]));

  const notified = new Set();
  for (const app of apps) {
    const email = emailById[app.volunteerId];
    if (!email || notified.has(email)) continue;
    notified.add(email);
    await sendNotificationEmail(
      email,
      "Event Cancelled",
      `Hi ${app.volunteerName},\n\nThe event "${event.title}" on ${event.date} has been cancelled.\n\nVolunteerHub`
    );
    await publishNotification(app.volunteerId, "event_cancelled", {
      eventId: String(event._id),
      title: event.title,
      date: event.date
    });
  }

  await cache.invalidateEvents();
  return event.toObject();
}
async function deleteEvent(eventId, user) {
  if (user.role !== "Admin") throw buildError("Forbidden", 403);
  const event = await Event.findById(eventId);
  if (!event) throw buildError("Event not found", 404);
  await Application.deleteMany({ eventId: String(eventId) });
  await Event.findByIdAndDelete(eventId);
  await cache.invalidateEvents();
  return { deleted: true, eventId: String(eventId) };
}
module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  deleteEvent
};

