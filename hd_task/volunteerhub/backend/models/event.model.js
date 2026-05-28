const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "title is required"], trim: true },
    description: { type: String, required: [true, "description is required"], trim: true },
    date: { type: String, required: [true, "date is required"] },
    startTime: { type: String, required: [true, "startTime is required"] },
    endTime: { type: String, required: [true, "endTime is required"] },
    location: { type: String, required: [true, "location is required"], trim: true },
    category: { type: String, required: [true, "category is required"], trim: true },
    maxVolunteers: { type: Number, required: [true, "maxVolunteers is required"], min: 1 },
    roles: [
      {
        roleTitle: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        requiredSkills: [{ type: String }],
        capacity: { type: Number, required: true, min: 1 }
      }
    ],
    createdBy: { type: String, required: [true, "createdBy is required"] },
    organizationId: { type: String, default: null },
    status: { type: String, enum: ["Published", "Cancelled"], default: "Published" },
    cancelledAt: { type: Date, default: null }
  },
  { versionKey: false, timestamps: true, strict: true }
);

module.exports = mongoose.model("Event", eventSchema);
