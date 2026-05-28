const {
  addSseClient,
  removeSseClient,
  writeSse
} = require("../services/notification-hub.service");

exports.streamNotifications = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = req.user.id;
  addSseClient(userId, res);
  writeSse(res, "connected", { message: "Notification stream active" });

  const heartbeat = setInterval(() => {
    try {
      writeSse(res, "ping", { t: Date.now() });
    } catch (_error) {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(userId, res);
  });
};
