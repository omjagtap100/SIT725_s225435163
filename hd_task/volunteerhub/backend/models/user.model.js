
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    email: { type: String, required: [true, "email is required"], unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: [true, "passwordHash is required"] },
    role: {
      type: String,
      enum: ["Volunteer", "OrganisationManager", "Admin"],
      required: [true, "role is required"]
    },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: [{ type: String }],
    isActive: { type: Boolean, default: true },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
  },
  { versionKey: false, timestamps: true, strict: true }
);

module.exports = mongoose.model("User", userSchema);
