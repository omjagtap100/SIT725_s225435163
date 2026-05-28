const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
const { performanceMiddleware } = require("./middleware/performance.middleware");
const cache = require("./services/cache.service");
const { getMonitoringSnapshot } = require("./services/monitoring.service");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(performanceMiddleware);

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "volunteerhub-backend-monolith",
      ...getMonitoringSnapshot(cache.getStatus())
    });
  });

  app.get("/api/student", (_req, res) => {
    res.json({
      name: process.env.STUDENT_NAME || "Om Jagtap",
      studentId: process.env.STUDENT_ID || "s225435163"
    });
  });

  app.use("/", apiRouter);

  app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || "Server error" });
  });

  return app;
}

module.exports = createApp;
