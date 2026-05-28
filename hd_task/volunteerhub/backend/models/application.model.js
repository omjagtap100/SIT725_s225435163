
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: [true, "eventId is required"] },
    roleTitle: { type: String, required: [true, "roleTitle is required"] },
    volunteerId: { type: String, required: [true, "volunteerId is required"] },
    volunteerName: { type: String, required: [true, "volunteerName is required"] },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending"
    },
    checkedInAt: { type: Date, default: null },
    hoursContributed: { type: Number, default: 0 }
  },
  { versionKey: false, timestamps: true, strict: true }
);

applicationSchema.index({ eventId: 1, roleTitle: 1, volunteerId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
