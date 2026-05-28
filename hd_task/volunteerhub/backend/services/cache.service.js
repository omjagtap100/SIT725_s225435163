
const memoryCache = new Map();
let redisClient = null;
let cacheMode = "memory";
let redisReady = false;

const DEFAULT_TTL_SEC = Number(process.env.CACHE_TTL_SEC || 120);

async function initCache() {
  const url = process.env.REDIS_URL;
  if (!url) {
    cacheMode = "memory";
    return getStatus();
  }

  try {
    const { createClient } = require("redis");
    redisClient = createClient({ url });
    redisClient.on("error", (err) => {
      console.warn("[cache] Redis error:", err.message);
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    cacheMode = "redis";
    console.log("[cache] Redis connected");
  } catch (error) {
    console.warn("[cache] Redis unavailable, using memory fallback:", error.message);
    redisClient = null;
    redisReady = false;
    cacheMode = "memory";
  }
  return getStatus();
}

function getStatus() {
  return {
    mode: cacheMode,
    redisConnected: redisReady,
    memoryEntries: memoryCache.size
  };
}

async function get(key) {
  if (redisReady && redisClient) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSec = DEFAULT_TTL_SEC) {
  const serialized = JSON.stringify(value);
  if (redisReady && redisClient) {
    await redisClient.setEx(key, ttlSec, serialized);
    return;
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000
  });
}

async function del(key) {
  if (redisReady && redisClient) {
    await redisClient.del(key);
  }
  memoryCache.delete(key);
}

async function invalidatePrefix(prefix) {
  if (redisReady && redisClient) {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length) await redisClient.del(keys);
    return;
  }
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(prefix)) memoryCache.delete(key);git 
  }
  
}

function eventsListKey(query) {
  return `events:list:${JSON.stringify(query)}`;
}

function eventDetailKey(id) {
  return `events:detail:${id}`;
}

async function invalidateEvents() {
  await invalidatePrefix("events:");
}

module.exports = {
  initCache,
  getStatus,
  get,
  set,
  del,
  invalidateEvents,
  eventsListKey,
  eventDetailKey
};
