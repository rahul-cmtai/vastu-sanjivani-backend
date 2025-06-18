const mongoose = require("mongoose");

const subServiceSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Sub-service name is required."], trim: true },
  slug: { type: String, required: [true, "Sub-service slug is required."], trim: true, lowercase: true },
  description: { type: String, required: [true, "Sub-service description is required."], trim: true },
  imageUrl: { type: String, trim: true, default: null }, // Stores S3 URL
  imageKey: { type: String, trim: true, default: null } // Stores S3 object key for deletion
});

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Service name is required."], trim: true, unique: true },
    slug: { type: String, required: [true, "Slug is required."], trim: true, lowercase: true, unique: true },
    description: { type: String, required: [true, "Description is required."], trim: true },
    mainImage: { type: String, required: [true, "Main image URL is required."] }, // Stores S3 URL
    mainImageKey: { type: String, required: [true, "Main image key is required."] }, // Stores S3 object key
    subServices: [subServiceSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);

module.exports = ServiceCategory;
