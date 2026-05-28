const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { sseAuth } = require("../middleware/sse-auth.middleware");



const express = require("express");
const Controllers = require("../controllers");
const authRouter = express.Router();
authRouter.post("/register", Controllers.authController.register);
authRouter.post("/login", Controllers.authController.login);
authRouter.post("/forgot-password", Controllers.authController.forgotPassword);
authRouter.post("/reset-password", Controllers.authController.resetPassword);
authRouter.patch("/profile", requireAuth, Controllers.authController.updateProfile);
authRouter.get("/profile", requireAuth, Controllers.authController.getProfile);
 

 
authRouter.post(
  "/organizations",
  requireAuth,
  requireRole(["OrganisationManager"]),
  Controllers.authController.createOrganization
);
authRouter.get("/organizations", requireAuth, Controllers.authController.getOrganizations);
authRouter.get(
  "/organizations/me",
  requireAuth,
  requireRole(["OrganisationManager"]),
  Controllers.authController.getMyOrganization
);
authRouter.patch(
  "/organizations/:id/review",
  requireAuth,
  requireRole(["Admin"]),
  Controllers.authController.reviewOrganization
);
authRouter.put(
  "/organizations/:id",
  requireAuth,
  requireRole(["OrganisationManager"]),
  Controllers.authController.updateOrganization
);
authRouter.patch("/users/:id/active", requireAuth, requireRole(["Admin"]), Controllers.authController.setUserActive);
authRouter.delete(
  "/organizations/:id",
  requireAuth,
  requireRole(["Admin"]),
  Controllers.authController.deleteOrganization
);
const eventsRouter = express.Router();
eventsRouter.get("/", requireAuth, Controllers.eventController.getAllEvents);
eventsRouter.get("/:id", requireAuth, Controllers.eventController.getEventById);
eventsRouter.post(
  "/",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.eventController.createEvent
);
eventsRouter.put(
  "/:id",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.eventController.updateEvent
);
eventsRouter.patch(
  "/:id/cancel",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.eventController.cancelEvent
);
eventsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["Admin"]),
  Controllers.eventController.deleteEvent
);
const applicationsRouter = express.Router();
applicationsRouter.post(
  "/",
  requireAuth,
  requireRole(["Volunteer"]),
  Controllers.applicationController.createApplication
);
applicationsRouter.get("/me", requireAuth, requireRole(["Volunteer"]), Controllers.applicationController.getMyApplications);

applicationsRouter.get(
  "/me/history",
  requireAuth,
  requireRole(["Volunteer"]),
  Controllers.applicationController.getParticipationHistory
);
applicationsRouter.get(
  "/event/:eventId/export",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.applicationController.exportEventParticipation
);

applicationsRouter.patch(
  "/:id/check-in",
  requireAuth,
  requireRole(["Volunteer"]),
  Controllers.applicationController.checkIn
);
applicationsRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.applicationController.updateStatus
);
applicationsRouter.get(
  "/event/:eventId",
  requireAuth,
  requireRole(["OrganisationManager", "Admin"]),
  Controllers.applicationController.getEventApplications
);
 

const notificationsRouter = express.Router();
notificationsRouter.get("/stream", sseAuth, Controllers.notificationController.streamNotifications);

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/applications", applicationsRouter);
apiRouter.use("/notifications", notificationsRouter);
module.exports = apiRouter; 