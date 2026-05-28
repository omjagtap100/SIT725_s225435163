
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, required: [true, "description is required"], trim: true },
    category: { type: String, required: [true, "category is required"], trim: true },
    address: { type: String, required: [true, "address is required"], trim: true },
    contactEmail: { type: String, required: [true, "contactEmail is required"], trim: true, lowercase: true },
    managerUserId: { type: String, required: [true, "managerUserId is required"] },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
  },
  { versionKey: false, timestamps: true, strict: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
