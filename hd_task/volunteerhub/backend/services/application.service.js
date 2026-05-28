
const Application = require("../models/application.model");
const Organization = require("../models/organization.model");
const Event = require("../models/event.model");
const User = require("../models/user.model");
const { sendNotificationEmail } = require("./notification.service");
const { calculateEventDurationHours } = require("./hours.service");
const cache = require("./cache.service");
const { publishNotification } = require("./notification-hub.service");
 
function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
 
async function createApplication(payload, user) {
  const { eventId, roleTitle } = payload;
  if (!eventId || !roleTitle) throw buildError("eventId and roleTitle are required", 400);
 
  const event = await Event.findById(eventId).lean();
  if (!event) throw buildError("Event not found", 404);
  if (event.status === "Cancelled") throw buildError("Cannot apply to a cancelled event", 400);
 
  const role = (event.roles || []).find((r) => r.roleTitle === roleTitle);
  if (!role && (event.roles || []).length > 0) {
    throw buildError("Invalid role for this event", 400);
  }
 
  const duplicate = await Application.findOne({
    eventId: String(eventId),
    roleTitle,
    volunteerId: user.id
  }).lean();
  if (duplicate) throw buildError("Already applied to this role", 409);

  try {
    const created = await Application.create({
      eventId: String(eventId),
      roleTitle,
      volunteerId: user.id,
      volunteerName: user.name,
      status: "Pending"
    });
    await cache.invalidateEvents();
    return created;
  } catch (error) {
    if (error.code === 11000) throw buildError("Already applied to this role", 409);
    throw error;
  }
}
 
async function updateStatus(id, status) {
  if (!["Accepted", "Declined"].includes(status)) throw buildError("Invalid status", 400);
 
  const application = await Application.findById(id);
  if (!application) throw buildError("Application not found", 404);
 
  if (status === "Accepted" && application.status !== "Accepted") {
    const event = await Event.findById(application.eventId).lean();
    if (!event) throw buildError("Event not found", 404);
 
    const acceptedCount = await Application.countDocuments({
      eventId: application.eventId,
      roleTitle: application.roleTitle,
      status: "Accepted"
    });
    const role = (event.roles || []).find((r) => r.roleTitle === application.roleTitle);
    const capacity = role ? role.capacity : event.maxVolunteers;
    if (acceptedCount >= capacity) throw buildError("Role is at full capacity", 409);
  }
 
  application.status = status;
  await application.save();
 
  const volunteer = await User.findById(application.volunteerId).select("email name").lean();
  if (volunteer?.email) {
    const subject = status === "Accepted" ? "Application Accepted" : "Application Declined";
    await sendNotificationEmail(
      volunteer.email,
      subject,
      `Hi ${volunteer.name},\n\nYour application for role "${application.roleTitle}" has been ${status.toLowerCase()}.\n\nVolunteerHub`
    );
  }

  await cache.invalidateEvents();
  await publishNotification(application.volunteerId, "application_updated", {
    applicationId: String(application._id),
    eventId: application.eventId,
    roleTitle: application.roleTitle,
    status: application.status
  });

  return application.toObject();
}
 
async function getEventApplications(eventId) {
  return Application.find({ eventId: String(eventId) }).sort({ createdAt: -1 }).lean();
}
 
async function getMyApplications(userId) {
  return Application.find({ volunteerId: userId }).sort({ createdAt: -1 }).lean();
}

async function assertManagerCanAccessEvent(eventId, user) {
  const event = await Event.findById(eventId).lean();
  if (!event) throw buildError("Event not found", 404);
  if (user.role === "Admin") return event;
  if (user.role !== "OrganisationManager") throw buildError("Forbidden", 403);
  const org = await Organization.findOne({ managerUserId: user.id }).lean();
  if (!org || String(event.organizationId) !== String(org._id)) {
    throw buildError("Forbidden for this event", 403);
  }
  return event;
}
 
function csvEscapeRow(values) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    })
    .join(",");
}
 
async function getParticipationHistory(userId) {
  const apps = await Application.find({ volunteerId: userId }).sort({ createdAt: -1 }).lean();
  const eventIds = [...new Set(apps.map((app) => app.eventId))];
  const events = eventIds.length ? await Event.find({ _id: { $in: eventIds } }).lean() : [];
  const eventMap = Object.fromEntries(events.map((event) => [String(event._id), event]));
 
  const items = apps.map((app) => {
    const event = eventMap[app.eventId];
    return {
      applicationId: String(app._id),
      eventId: app.eventId,
      eventTitle: event?.title || "Unknown event",
      eventDate: event?.date || "",
      eventLocation: event?.location || "",
      eventCategory: event?.category || "",
      roleTitle: app.roleTitle,
      status: app.status,
      checkedInAt: app.checkedInAt,
      hoursContributed: app.hoursContributed || 0
    };
  });
 
  const totalHours = items.reduce((sum, item) => sum + Number(item.hoursContributed || 0), 0);
  const completedCheckIns = items.filter((item) => item.checkedInAt).length;
  const acceptedCount = items.filter((item) => item.status === "Accepted").length;
 
  return {
    summary: {
      totalApplications: items.length,
      acceptedCount,
      completedCheckIns,
      totalHours: Number(totalHours.toFixed(2))
    },
    items
  };
}
 
async function exportEventParticipationCsv(eventId, user) {
  await assertManagerCanAccessEvent(eventId, user);
  const apps = await Application.find({ eventId: String(eventId) }).sort({ createdAt: -1 }).lean();
  const volunteerIds = [...new Set(apps.map((app) => app.volunteerId))];
  const users = volunteerIds.length
    ? await User.find({ _id: { $in: volunteerIds } }).select("email name").lean()
    : [];
  const emailMap = Object.fromEntries(users.map((u) => [String(u._id), u.email]));
 
  const header = csvEscapeRow([
    "Volunteer Name",
    "Email",
    "Role",
    "Status",
    "Checked In",
    "Hours Contributed"
  ]);
  const rows = apps.map((app) =>
    csvEscapeRow([
      app.volunteerName,
      emailMap[app.volunteerId] || "",
      app.roleTitle,
      app.status,
      app.checkedInAt ? new Date(app.checkedInAt).toISOString() : "",
      app.hoursContributed || 0
    ])
  );
  return `${header}\n${rows.join("\n")}\n`;
}



 
async function checkIn(applicationId, user) {
  const app = await Application.findById(applicationId);
  if (!app) throw buildError("Application not found", 404);
  if (String(app.volunteerId) !== String(user.id)) throw buildError("Forbidden", 403);
  if (app.status !== "Accepted") throw buildError("Only accepted volunteers can check in", 400);
  if (app.checkedInAt) throw buildError("Already checked in", 409);
 
  const event = await Event.findById(app.eventId).lean();
  if (!event) throw buildError("Event not found", 404);
 
  
  const today = new Date();


const [year, month, day] = String(event.date).split("-").map(Number);
const eventDayKey = Date.UTC(year, month - 1, day);


const todayDayKey = Date.UTC(
  today.getUTCFullYear(),
  today.getUTCMonth(),
  today.getUTCDate()   
);

const diffDays = Math.abs((todayDayKey - eventDayKey) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) throw buildError("Check-in allowed only on the event day (or day before/after for demo)", 400);
 
  const durationHours = calculateEventDurationHours(event.startTime, event.endTime);

  app.checkedInAt = new Date();
  app.hoursContributed = durationHours;
  await app.save();
  await cache.invalidateEvents();
  return app.toObject();
}
 

module.exports = {
  createApplication,
  updateStatus,
  getEventApplications,
 getParticipationHistory,
  exportEventParticipationCsv,
  getMyApplications,
  checkIn
};