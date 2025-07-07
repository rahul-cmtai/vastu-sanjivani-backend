const express = require('express');
const router = express.Router();
const upload = require('../middleware/studentUpload');
const {
  createStudent,
  getAllStudents,
  getStudentBySlug,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsBySpecialization,
  getFeaturedStudents,
  addTestimonial,
  addProject,
  addEducation
} = require('../controllers/Student');

const {
  validateStudentBody,
  validateTestimonialBody,
  validateProjectBody,
  validateEducationBody
} = require('../middleware/validateStudentBody');

// Basic CRUD operations
router.post('/students', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]), 
  validateStudentBody, 
  createStudent
);

router.get('/students', getAllStudents);
router.get('/students/featured', getFeaturedStudents);
router.get('/students/slug/:slug', getStudentBySlug);
router.get('/students/:id', getStudentById);

router.put('/students/:id', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]), 
  validateStudentBody, 
  updateStudent
);

router.delete('/students/:id', deleteStudent);

// Specialized routes
router.get('/students/specialization/:specialization', getStudentsBySpecialization);

// Add additional data to student
router.post('/students/:id/testimonials', validateTestimonialBody, addTestimonial);
router.post('/students/:id/projects', 
  upload.fields([{ name: 'image', maxCount: 1 }]), 
  validateProjectBody, 
  addProject
);
router.post('/students/:id/education', validateEducationBody, addEducation);

// Test endpoint for image upload
router.post('/test-upload', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]), 
  (req, res) => {
    try {
      console.log('Test upload - Files received:', req.files);
      console.log('Test upload - Body received:', req.body);
      
      const imageUrl = req.files?.image?.[0]?.location || "";
      const coverImageUrl = req.files?.coverImage?.[0]?.location || "";
      
      res.json({
        success: true,
        message: 'Test upload successful',
        data: {
          image: imageUrl,
          coverImage: coverImageUrl,
          files: req.files
        }
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Test upload failed',
        error: error.message
      });
    }
  }
);

// Check environment variables
router.get('/check-config', (req, res) => {
  const config = {
    aws: {
      region: process.env.AWS_REGION || 'Not set',
      bucket: process.env.AWS_BUCKET_NAME || 'Not set',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    },
    server: {
      port: process.env.PORT || 5000,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };
  
  console.log('Environment check:', config);
  
  res.json({
    success: true,
    message: 'Environment configuration check',
    data: config
  });
});

module.exports = router; 