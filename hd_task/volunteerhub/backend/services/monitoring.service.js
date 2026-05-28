/**
 * NFR-11, NFR-12: Basic reliability and email delivery monitoring (in-process).
 */
const startedAt = Date.now();

const emailMetrics = {
  attempts: 0,
  delivered: 0,
  failed: 0,
  lastSubject: null,
  lastLatencyMs: 0,
  lastError: null,
  lastSentAt: null
};

const requestMetrics = {
  total: 0,
  totalMs: 0,
  slowOver1s: 0,
  lastPath: null,
  lastDurationMs: 0
};

function recordEmailAttempt({ delivered, subject, latencyMs, error = null }) {
  emailMetrics.attempts += 1;
  emailMetrics.lastSubject = subject;
  emailMetrics.lastLatencyMs = latencyMs;
  emailMetrics.lastError = error ? String(error.message || error) : null;
  if (delivered) {
    emailMetrics.delivered += 1;
    emailMetrics.lastSentAt = new Date().toISOString();
  } else {
    emailMetrics.failed += 1;
  }
}

function recordRequest({ path, durationMs }) {
  requestMetrics.total += 1;
  requestMetrics.totalMs += durationMs;
  requestMetrics.lastPath = path;
  requestMetrics.lastDurationMs = durationMs;
  if (durationMs >= 1000) requestMetrics.slowOver1s += 1;
}

function getMonitoringSnapshot(cacheStatus = {}) {
  const uptimeMs = Date.now() - startedAt;
  const avgMs = requestMetrics.total ? requestMetrics.totalMs / requestMetrics.total : 0;
  return {
    ok: true,
    uptimeSeconds: Math.floor(uptimeMs / 1000),
    cache: cacheStatus,
    email: { ...emailMetrics },
    requests: {
      ...requestMetrics,
      averageMs: Number(avgMs.toFixed(2))
    }
  };
}

module.exports = {
  recordEmailAttempt,
  recordRequest,
  getMonitoringSnapshot
};
