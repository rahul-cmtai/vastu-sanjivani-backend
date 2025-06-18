const Testimonial = require("../model/Testimonial");
const mongoose = require("mongoose");

// Create a new testimonial
const createTestimonial = async (req, res) => {
  try {
    // Log request details for debugging
    console.log("Create testimonial request:", {
      body: req.body,
      file: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        location: req.file.location
      } : null
    });

    const {
      name,
      designation,
      content,
      rating,
      isActive,
      order
    } = req.body;

    // Validate required fields
    if (!name || !designation || !content) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["name", "designation", "content"] 
      });
    }

    // Check if media file was uploaded
    let mediaUrl = "";
    let mediaType = "none";

    if (req.file && req.file.location) {
      mediaUrl = req.file.location; // S3 URL
      
      // Determine media type based on mimetype
      if (req.file.mimetype.startsWith("image/")) {
        mediaType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        mediaType = "video";
      }
    }

    // Handle numeric and boolean values that might come as strings from form data
    const parsedRating = rating ? parseInt(rating) : 5;
    const parsedOrder = order ? parseInt(order) : 0;
    const parsedIsActive = isActive === 'true' || isActive === true || isActive === undefined;

    const testimonial = new Testimonial({
      name,
      designation,
      content,
      rating: parsedRating,
      mediaUrl,
      mediaType,
      isActive: parsedIsActive,
      order: parsedOrder
    });

    await testimonial.save();
    res.status(201).json({
      message: "Testimonial created successfully",
      testimonial
    });
  } catch (err) {
    console.error("Error creating testimonial:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all testimonials
const getTestimonials = async (req, res) => {
  try {
    // Support optional filtering by isActive
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const testimonials = await Testimonial.find(filter)
      .sort({ order: 1, createdAt: -1 });
    
    res.status(200).json(testimonials);
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get testimonial by ID
const getTestimonialById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid testimonial ID format" });
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }
    
    res.status(200).json(testimonial);
  } catch (err) {
    console.error("Error fetching testimonial:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update testimonial
const updateTestimonial = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid testimonial ID format" });
    }
    
    // Get existing testimonial first
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    // Parse data from form-data or JSON
    const {
      name,
      designation,
      content,
      rating,
      isActive,
      order
    } = req.body;
    
    // Log request details for debugging
    console.log("Update testimonial request:", {
      id,
      body: req.body,
      file: req.file ? {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        location: req.file.location
      } : null
    });

    // Prepare update object
    const updateData = {};
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (designation !== undefined) updateData.designation = designation;
    if (content !== undefined) updateData.content = content;
    if (rating !== undefined) updateData.rating = parseInt(rating) || 5;
    
    // Handle boolean fields (may come as strings from form data)
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === 'true';
    }
    
    // Handle numeric fields (may come as strings from form data)
    if (order !== undefined) {
      updateData.order = parseInt(order) || 0;
    }

    // Update media if new file is uploaded
    if (req.file && req.file.location) {
      updateData.mediaUrl = req.file.location;
      
      if (req.file.mimetype.startsWith("image/")) {
        updateData.mediaType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        updateData.mediaType = "video";
      }
    }

    console.log("Updating testimonial with data:", updateData);

    // Update with validated data
    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Testimonial updated successfully",
      testimonial: updatedTestimonial
    });
  } catch (err) {
    console.error("Error updating testimonial:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete testimonial
const deleteTestimonial = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log("Delete testimonial request for ID:", id);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid testimonial ID format:", id);
      return res.status(400).json({ error: "Invalid testimonial ID format" });
    }
    
    const testimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!testimonial) {
      console.log("Testimonial not found for ID:", id);
      return res.status(404).json({ message: "Testimonial not found" });
    }
    
    console.log("Testimonial deleted successfully:", id);
    res.status(200).json({ 
      message: "Testimonial deleted successfully", 
      deletedTestimonial: testimonial 
    });
  } catch (err) {
    console.error("Error deleting testimonial:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial
}; 