/**
 * FR-20: Calculate volunteer hours from event start/end times.
 */
function calculateEventDurationHours(startTime, endTime) {
  const [sh, sm] = String(startTime || "00:00").split(":").map(Number);
  const [eh, em] = String(endTime || "00:00").split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const hours = Math.max((endMinutes - startMinutes) / 60, 0);
  return Number(hours.toFixed(2));
}

module.exports = { calculateEventDurationHours };
