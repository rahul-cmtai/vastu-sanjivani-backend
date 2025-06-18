const mongoose = require("mongoose");
const Course = require("../model/Course");
const { s3Client, deleteFromS3 } = require("../config/s3Config");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

/**
 * Helper function to upload a file buffer to S3.
 * @param {Buffer} fileBuffer The file buffer from multer's memoryStorage.
 * @param {string} folderName The folder name in S3.
 * @param {string} originalName The original file name.
 * @returns {Promise<object>} The upload result.
 */
const uploadToS3 = async (fileBuffer, folderName, originalName) => {
  try {
    const key = `${folderName}/${Date.now()}-${originalName}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'image/jpeg', // You may want to detect this dynamically
    };
    
    await s3Client.send(new PutObjectCommand(params));
    
    // Construct the URL (this is the S3 URL format)
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return { 
      url: url,
      key: key
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

// @desc    Create a new Course
exports.createCourse = async (req, res) => {
  try {
    const { 
      title, 
      slug, 
      description, 
      shortDescription,
      price, 
      originalPrice,
      category,
      instructor,
      duration,
      level,
      language,
      features,
      requirements,
      whatYouWillLearn,
      isActive,
      isFeatured,
      certificateIncluded,
      lifetimeAccess,
      mobileAccess
    } = req.body;

    if (!title || !slug || !description || !price || !category) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const existingCourse = await Course.findOne({ $or: [{ title }, { slug }] });
    if (existingCourse) {
      return res.status(400).json({ error: "A course with this title or slug already exists." });
    }

    let imageUploadResult = null;
    if (req.file) {
      imageUploadResult = await uploadToS3(req.file.buffer, "courses", req.file.originalname);
    } else {
      return res.status(400).json({ error: "Course image is required." });
    }

    // Parse arrays from string if they come as JSON strings
    const parsedFeatures = features ? (typeof features === 'string' ? JSON.parse(features) : features) : [];
    const parsedRequirements = requirements ? (typeof requirements === 'string' ? JSON.parse(requirements) : requirements) : [];
    const parsedWhatYouWillLearn = whatYouWillLearn ? (typeof whatYouWillLearn === 'string' ? JSON.parse(whatYouWillLearn) : whatYouWillLearn) : [];

    const newCourse = new Course({
      title,
      slug,
      description,
      shortDescription,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      category,
      instructor,
      duration,
      level,
      language,
      features: parsedFeatures,
      requirements: parsedRequirements,
      whatYouWillLearn: parsedWhatYouWillLearn,
      isActive: isActive === "true",
      isFeatured: isFeatured === "true",
      certificateIncluded: certificateIncluded === "true",
      lifetimeAccess: lifetimeAccess === "true",
      mobileAccess: mobileAccess === "true",
      imageUrl: imageUploadResult.url,
      imageKey: imageUploadResult.key,
    });

    const savedCourse = await newCourse.save();
    res.status(201).json({ message: "Course created successfully", data: savedCourse });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in createCourse:", error);
    res.status(500).json({ error: "Server error while creating course.", errorMessage: error.message });
  }
};

// @desc    Update an existing Course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Course ID." });
    }

    const courseToUpdate = await Course.findById(id);
    if (!courseToUpdate) {
      return res.status(404).json({ error: "Course not found." });
    }

    const { 
      title, 
      slug, 
      description, 
      shortDescription,
      price, 
      originalPrice,
      category,
      instructor,
      duration,
      level,
      language,
      features,
      requirements,
      whatYouWillLearn,
      isActive,
      isFeatured,
      certificateIncluded,
      lifetimeAccess,
      mobileAccess
    } = req.body;

    // Check if slug is being changed and if it conflicts with existing course
    if (slug && slug !== courseToUpdate.slug) {
      const existingCourse = await Course.findOne({ slug, _id: { $ne: id } });
      if (existingCourse) {
        return res.status(400).json({ error: "A course with this slug already exists." });
      }
    }

    // Handle image upload if new image is provided
    if (req.file) {
      // Delete old image from S3
      await deleteFromS3(courseToUpdate.imageKey);
      
      // Upload new image
      const imageUploadResult = await uploadToS3(req.file.buffer, "courses", req.file.originalname);
      courseToUpdate.imageUrl = imageUploadResult.url;
      courseToUpdate.imageKey = imageUploadResult.key;
    }

    // Parse arrays from string if they come as JSON strings
    const parsedFeatures = features ? (typeof features === 'string' ? JSON.parse(features) : features) : [];
    const parsedRequirements = requirements ? (typeof requirements === 'string' ? JSON.parse(requirements) : requirements) : [];
    const parsedWhatYouWillLearn = whatYouWillLearn ? (typeof whatYouWillLearn === 'string' ? JSON.parse(whatYouWillLearn) : whatYouWillLearn) : [];

    // Update course fields
    courseToUpdate.title = title || courseToUpdate.title;
    courseToUpdate.slug = slug || courseToUpdate.slug;
    courseToUpdate.description = description || courseToUpdate.description;
    courseToUpdate.shortDescription = shortDescription || courseToUpdate.shortDescription;
    courseToUpdate.price = price ? parseFloat(price) : courseToUpdate.price;
    courseToUpdate.originalPrice = originalPrice ? parseFloat(originalPrice) : courseToUpdate.originalPrice;
    courseToUpdate.category = category || courseToUpdate.category;
    courseToUpdate.instructor = instructor || courseToUpdate.instructor;
    courseToUpdate.duration = duration || courseToUpdate.duration;
    courseToUpdate.level = level || courseToUpdate.level;
    courseToUpdate.language = language || courseToUpdate.language;
    courseToUpdate.features = parsedFeatures.length > 0 ? parsedFeatures : courseToUpdate.features;
    courseToUpdate.requirements = parsedRequirements.length > 0 ? parsedRequirements : courseToUpdate.requirements;
    courseToUpdate.whatYouWillLearn = parsedWhatYouWillLearn.length > 0 ? parsedWhatYouWillLearn : courseToUpdate.whatYouWillLearn;
    courseToUpdate.isActive = isActive !== undefined ? isActive === "true" : courseToUpdate.isActive;
    courseToUpdate.isFeatured = isFeatured !== undefined ? isFeatured === "true" : courseToUpdate.isFeatured;
    courseToUpdate.certificateIncluded = certificateIncluded !== undefined ? certificateIncluded === "true" : courseToUpdate.certificateIncluded;
    courseToUpdate.lifetimeAccess = lifetimeAccess !== undefined ? lifetimeAccess === "true" : courseToUpdate.lifetimeAccess;
    courseToUpdate.mobileAccess = mobileAccess !== undefined ? mobileAccess === "true" : courseToUpdate.mobileAccess;

    const updatedCourse = await courseToUpdate.save();
    res.status(200).json({ message: "Course updated successfully", data: updatedCourse });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in updateCourse:", error);
    res.status(500).json({ error: "Server error while updating course.", errorMessage: error.message });
  }
};

// @desc    Delete a Course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID." });
    }
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    // Delete image from S3
    await deleteFromS3(course.imageKey);

    await course.deleteOne();
    res.status(200).json({ message: "Course deleted successfully." });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in deleteCourse:", error);
    res.status(500).json({ error: "Server error." });
  }
};

// @desc    Find all Courses (for admin)
exports.findAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("!!! CRITICAL ERROR in findAllCourses:", error);
    res.status(500).json({ error: "Server error while fetching courses." });
  }
};

// @desc    Get all ACTIVE Courses (for public website)
exports.getAllPublicCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("!!! CRITICAL ERROR in getAllPublicCourses:", error);
    res.status(500).json({ error: "Server error while fetching public courses." });
  }
};

// @desc    Get featured courses
exports.getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    console.error("!!! CRITICAL ERROR in getFeaturedCourses:", error);
    res.status(500).json({ error: "Server error while fetching featured courses." });
  }
};

// @desc    Get a single active Course by slug or ID
exports.getCourseBySlugOrId = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    
    // Primarily find by slug, as that's the main use case for public detail pages.
    // Also, ensure the course is active.
    const course = await Course.findOne({ 
      slug: slugOrId,
      isActive: true 
    });
    
    // If found, return it.
    if (course) {
      return res.status(200).json(course);
    }
    
    // If not found by slug, maybe it was an ID? (Less likely but good to support)
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      const courseById = await Course.findOne({ 
        _id: slugOrId, 
        isActive: true 
      });
      if (courseById) {
        return res.status(200).json(courseById);
      }
    }

    // If no active course is found by either slug or ID, return 404.
    return res.status(404).json({ error: "Course not found or is not currently active." });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in getCourseBySlugOrId:", error);
    res.status(500).json({ error: "Server error while fetching the course details." });
  }
};

// @desc    Search courses
exports.searchCourses = async (req, res) => {
  try {
    const { q, category, level, minPrice, maxPrice } = req.query;
    
    let query = { isActive: true };
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Level filter
    if (level) {
      query.level = level;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.status(200).json(courses);
    
  } catch (error) {
    console.error("!!! CRITICAL ERROR in searchCourses:", error);
    res.status(500).json({ error: "Server error while searching courses." });
  }
};

// @desc    Get courses by category
exports.getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const courses = await Course.find({ 
      category: category, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(courses);
  } catch (error) {
    console.error("!!! CRITICAL ERROR in getCoursesByCategory:", error);
    res.status(500).json({ error: "Server error while fetching courses by category." });
  }
};

// @desc    Update course rating
exports.updateCourseRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Course ID." });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    
    // Calculate new average rating
    const newTotalRatings = course.totalRatings + 1;
    const newRating = ((course.rating * course.totalRatings) + rating) / newTotalRatings;
    
    course.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal place
    course.totalRatings = newTotalRatings;
    
    await course.save();
    
    res.status(200).json({ 
      message: "Rating updated successfully", 
      data: { rating: course.rating, totalRatings: course.totalRatings } 
    });
    
  } catch (error) {
    console.error("!!! CRITICAL ERROR in updateCourseRating:", error);
    res.status(500).json({ error: "Server error while updating rating." });
  }
}; 