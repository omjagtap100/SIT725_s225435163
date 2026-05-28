const jwt = require("jsonwebtoken");


function sseAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const queryToken = req.query.token;
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : String(queryToken || "").trim();

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "volunteerhub-secret");
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { sseAuth };
