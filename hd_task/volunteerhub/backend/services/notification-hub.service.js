
const localClients = new Map();

function addSseClient(userId, res) {
  const key = String(userId);
  if (!localClients.has(key)) localClients.set(key, new Set());
  localClients.get(key).add(res);
}

function removeSseClient(userId, res) {
  const key = String(userId);
  const set = localClients.get(key);
  if (!set) return;
  set.delete(res);
  if (!set.size) localClients.delete(key);
}

function writeSse(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function notifyLocal(userId, eventName, data) {
  const set = localClients.get(String(userId));
  if (!set) return;
  for (const res of set) {
    try {
      writeSse(res, eventName, data);
    } catch (_error) {
      set.delete(res);
    }
  }
}

async function publishNotification(userId, eventName, data) {
  notifyLocal(userId, eventName, data);
}

async function initNotificationHub() {
  return { sse: "local-only" };
}

module.exports = {
  addSseClient,
  removeSseClient,
  writeSse,
  publishNotification,
  initNotificationHub
};
