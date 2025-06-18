const express = require("express");
const upload = require("../middleware/upload.js");
const {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial
} = require("../controllers/testimonial.js");

const router = express.Router();

// Create testimonial with media upload (image or video)
router.post("/create", upload.single("media"), createTestimonial);

// Get all testimonials (with optional isActive filter)
router.get("/", getTestimonials);

// Get testimonial by ID
router.get("/:id", getTestimonialById);

// Update testimonial with optional media upload - add both route patterns
router.put("/:id", upload.single("media"), updateTestimonial);
router.put("/update/:id", upload.single("media"), updateTestimonial);

// Delete testimonial - add both route patterns
router.delete("/:id", deleteTestimonial);
router.delete("/delete/:id", deleteTestimonial);

module.exports = router; 