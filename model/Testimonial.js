const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true
    },
    content: {
      type: String,
      required: [true, "Testimonial content is required"],
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    mediaUrl: {
      type: String,
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema); 