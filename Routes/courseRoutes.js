const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course");
const { uploadCourseImage } = require("../middleware/multerUpload");

// --- Specific string routes must be defined before generic routes with parameters ---

// @route   POST /courses/create (For creating a new course)
router.post(
  "/create",
  uploadCourseImage.single('image'),
  courseController.createCourse
);

// @route   GET /courses/find (For Admin Panel to get ALL courses, active and inactive)
router.get("/find", courseController.findAllCourses); 

// @route   GET /courses/public (For public site to get only ACTIVE courses)
router.get("/public", courseController.getAllPublicCourses);

// @route   GET /courses/featured (For public site to get featured courses)
router.get("/featured", courseController.getFeaturedCourses);

// @route   GET /courses/search (Search courses with filters)
router.get("/search", courseController.searchCourses);

// @route   GET /courses/category/:category (Get courses by category)
router.get("/category/:category", courseController.getCoursesByCategory);

// --- Generic routes with parameters (:id, :slugOrId) should be defined last ---

// @route   PUT /courses/:id (Update a course)
router.put(
  "/:id",
  uploadCourseImage.single('image'),
  courseController.updateCourse 
);

// @route   DELETE /courses/:id (Delete a course)
router.delete("/:id", courseController.deleteCourse);

// @route   POST /courses/:id/rating (Update course rating)
router.post("/:id/rating", courseController.updateCourseRating);

// @route   GET /courses/:slugOrId (Get a single course by its slug or ID)
// This should be last among GET routes to avoid conflicts with '/find', '/public', etc.
router.get("/:slugOrId", courseController.getCourseBySlugOrId);

module.exports = router; 