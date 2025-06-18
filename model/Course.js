const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, "Course title is required."], 
      trim: true 
    },
    slug: { 
      type: String, 
      required: [true, "Course slug is required."], 
      trim: true, 
      lowercase: true, 
      unique: true 
    },
    description: { 
      type: String, 
      required: [true, "Course description is required."], 
      trim: true 
    },
    shortDescription: { 
      type: String, 
      trim: true 
    },
    price: { 
      type: Number, 
      required: [true, "Course price is required."],
      min: [0, "Price cannot be negative"]
    },
    originalPrice: { 
      type: Number,
      min: [0, "Original price cannot be negative"]
    },
    rating: { 
      type: Number, 
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"]
    },
    totalRatings: { 
      type: Number, 
      default: 0 
    },
    imageUrl: { 
      type: String, 
      required: [true, "Course image is required."] 
    }, // Stores S3 URL
    imageKey: { 
      type: String, 
      required: [true, "Course image key is required."] 
    }, // Stores S3 object key
    category: { 
      type: String, 
      required: [true, "Course category is required."],
      trim: true
    },
    instructor: { 
      type: String, 
      default: "Admin",
      trim: true
    },
    duration: { 
      type: String, 
      trim: true 
    }, // e.g., "10 hours", "2 weeks"
    level: { 
      type: String, 
      enum: ["Beginner", "Intermediate", "Advanced"], 
      default: "Beginner" 
    },
    language: { 
      type: String, 
      default: "English",
      trim: true
    },
    features: [{ 
      type: String, 
      trim: true 
    }], // Array of course features
    requirements: [{ 
      type: String, 
      trim: true 
    }], // Array of prerequisites
    whatYouWillLearn: [{ 
      type: String, 
      trim: true 
    }], // Array of learning outcomes
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isFeatured: { 
      type: Boolean, 
      default: false 
    },
    enrollmentCount: { 
      type: Number, 
      default: 0 
    },
    certificateIncluded: { 
      type: Boolean, 
      default: true 
    },
    lifetimeAccess: { 
      type: Boolean, 
      default: true 
    },
    mobileAccess: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Create index for better search performance
courseSchema.index({ title: 'text', description: 'text', category: 'text' });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course; 