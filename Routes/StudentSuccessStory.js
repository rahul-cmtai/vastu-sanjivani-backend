const express = require("express");
const upload = require("../middleware/upload.js");
const {
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
} = require("../controllers/StudentSuccessStory.js");

const router = express.Router();

// For media upload, set req.folder to 'student-success-stories'
router.post("/create", (req, res, next) => { req.folder = 'student-success-stories'; next(); }, upload.single("media"), createStory);
router.get("/", getAllStories);
router.get("/:id", getStoryById);
router.put("/:id", (req, res, next) => { req.folder = 'student-success-stories'; next(); }, upload.single("media"), updateStory);
router.delete("/:id", deleteStory);

module.exports = router; 