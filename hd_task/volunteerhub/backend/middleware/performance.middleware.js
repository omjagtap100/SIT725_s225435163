/**
 * NFR-01: Record API response times for baseline monitoring.
 */
const { recordRequest } = require("../services/monitoring.service");

function performanceMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    recordRequest({ path: req.path, durationMs });
  });
  next();
}

module.exports = { performanceMiddleware };
