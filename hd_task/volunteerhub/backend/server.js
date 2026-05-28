
const mongoose = require("mongoose");
const dns = require("node:dns");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const createApp = require("./app");

const app = createApp();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error(
    "MONGO_URI is required. Copy backend/.env.example to backend/.env or use Docker Compose."
  );
  process.exit(1);
}

if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length > 0) dns.setServers(servers);
} else {
  const current = dns.getServers();
  if (current.length === 1 && current[0] === "127.0.0.1") {
    // Work around local DNS resolvers that refuse SRV lookups (breaks mongodb+srv)
    dns.setServers(["1.1.1.1", "1.0.0.1"]);
  }
}

const cache = require("./services/cache.service");
const { initNotificationHub } = require("./services/notification-hub.service");

async function run() {
  await mongoose.connect(mongoUri);
  const cacheStatus = await cache.initCache();
  const sseStatus = await initNotificationHub();
  console.log("[startup] cache:", cacheStatus);
  console.log("[startup] notifications:", sseStatus);
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

run().catch((error) => {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
});











