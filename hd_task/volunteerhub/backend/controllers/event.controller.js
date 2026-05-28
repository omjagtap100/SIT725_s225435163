const eventService = require("../services/event.service");

exports.createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body || {}, req.user);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents(req.query || {});
    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body || {}, req.user);
    res.json(event);
  } catch (error) {
    next(error);
  }
};

exports.cancelEvent = async (req, res, next) => {
  try {
    const event = await eventService.cancelEvent(req.params.id, req.user);
    res.json(event);
  } catch (error) {
    next(error);
  }
};
exports.deleteEvent = async (req, res, next) => {
  try {
    const out = await eventService.deleteEvent(req.params.id, req.user);
    res.json(out);
  } catch (error) {
    next(error);
  }
};