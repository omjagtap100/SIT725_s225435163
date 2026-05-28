
const applicationService = require("../services/application.service");
 
exports.createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body || {}, req.user);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};
 
exports.updateStatus = async (req, res, next) => {
  try {
    const updated = await applicationService.updateStatus(req.params.id, req.body?.status);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
 
exports.getEventApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getEventApplications(req.params.eventId);
    res.json(applications);
  } catch (error) {
    next(error);
  }
};
 
exports.getMyApplications = async (req, res, next) => {
  try {
    const out = await applicationService.getMyApplications(req.user.id);
    res.json(out);
  } catch (error) {
    next(error);
  }
};
 
exports.getParticipationHistory = async (req, res, next) => {
  try {
    const history = await applicationService.getParticipationHistory(req.user.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
};
 
exports.exportEventParticipation = async (req, res, next) => {
  try {
    const csv = await applicationService.exportEventParticipationCsv(req.params.eventId, req.user);
    const safeId = String(req.params.eventId).replace(/[^a-zA-Z0-9-_]/g, "");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="participation-${safeId}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    const out = await applicationService.checkIn(req.params.id, req.user);
    res.json(out);
  } catch (error) {
    next(error);
  }
};