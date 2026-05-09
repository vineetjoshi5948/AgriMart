const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["farmer", "retailer", "admin"],
      required: true,
    },
    
    // Farmer profile fields
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    farmName: { type: String, default: "" },
    farmSize: { type: String, default: "" },
    primaryCrops: { type: String, default: "" },
    certification: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
