
const jwt = require("jsonwebtoken");
 
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = authHeader.slice(7).trim();
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
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Token not yet valid" });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
 
module.exports = { requireAuth,requireRole}