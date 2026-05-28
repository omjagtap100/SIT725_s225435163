const nodemailer = require("nodemailer");
const { recordEmailAttempt } = require("./monitoring.service");

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendNotificationEmail(to, subject, body) {
  const started = Date.now();
  if (!to) {
    recordEmailAttempt({ delivered: false, subject, latencyMs: 0, error: "missing recipient" });
    return { delivered: false, reason: "missing recipient" };
  }

  if (!transporter) {
    console.log(`[EMAIL] to=${to} subject=${subject}`);
    recordEmailAttempt({ delivered: true, subject, latencyMs: Date.now() - started });
    return { delivered: true, mode: "console-fallback" };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body
    });
    recordEmailAttempt({ delivered: true, subject, latencyMs: Date.now() - started });
    return { delivered: true, mode: "smtp" };
  } catch (error) {
    recordEmailAttempt({ delivered: false, subject, latencyMs: Date.now() - started, error });
    console.error("[EMAIL] send failed:", error.message);
    return { delivered: false, reason: error.message };
  }
}

module.exports = { sendNotificationEmail };
