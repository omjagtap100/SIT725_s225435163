
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
 
const app = express();
const PORT = process.env.PORT || 3300;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
 
function injectEnvIntoHtml(html) {
  const config = JSON.stringify({ API_BASE_URL });
  return html.replace("</head>", `    <script>window.__CONFIG__ = ${config};</script>\n  </head>`);
}
 
async function sendPage(res, filename) {
  const html = await fs.readFile(path.join(__dirname, "public", filename), "utf8");
  res.type("html").send(injectEnvIntoHtml(html));
}
 
app.get(["/", "/index.html"], async (_req, res, next) => {
  try {
    await sendPage(res, "index.html");
  } catch (e) {
    next(e);
  }
});

app.get(["/dashboard", "/dashboard.html"], async (_req, res, next) => {
  try {
    await sendPage(res, "dashboard.html");
  } catch (e) {
    next(e);
  }
});

app.get(["/event", "/event.html"], async (_req, res, next) => {
  try {
    await sendPage(res, "event.html");
  } catch (e) {
    next(e);
  }
});
 

 
 
app.use(express.static(path.join(__dirname, "public")));
 
app.get("*", (_req, res) => {
  res.redirect("/");
});
 
app.use((err, _req, res, _next) => {
  res.status(500).type("text").send(err.message || "Server error");
});
 
app.listen(PORT, () => {
  console.log(`Frontend running on ${PORT} (API_BASE_URL=${API_BASE_URL})`);
});