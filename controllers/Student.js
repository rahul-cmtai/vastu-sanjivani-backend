const Student = require('../model/Student');

// Create a new student
const createStudent = async (req, res) => {
  try {
    // Debug: Log upload information
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);
    
    // Handle image uploads with better error handling
    let imageUrl = "";
    let coverImageUrl = "";
    
    if (req.files?.image?.[0]) {
      imageUrl = req.files.image[0].location;
      console.log('Profile image uploaded:', imageUrl);
    }
    
    if (req.files?.coverImage?.[0]) {
      coverImageUrl = req.files.coverImage[0].location;
      console.log('Cover image uploaded:', coverImageUrl);
    }
    
    // Parse JSON strings for arrays and objects
    const parseField = (field) => {
      if (typeof field === 'string' && field.trim()) {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.log(`Failed to parse field: ${field}`);
          return field;
        }
      }
      return field;
    };
    
    // Parse specific fields that might be JSON strings
    const parsedBody = {
      ...req.body,
      specializations: parseField(req.body.specializations),
      education: parseField(req.body.education),
      projects: parseField(req.body.projects),
      testimonials: parseField(req.body.testimonials),
      badges: parseField(req.body.badges),
      skills: parseField(req.body.skills),
      socialLinks: parseField(req.body.socialLinks),
      contact: parseField(req.body.contact)
    };
    
    const studentData = {
      ...parsedBody,
      image: imageUrl,
      coverImage: coverImageUrl
    };

    console.log('Parsed student data:', studentData);

    const student = new Student(studentData);
    const savedStudent = await student.save();
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: savedStudent
    });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Student with this slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
};

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by specialization
    if (specialization) {
      query.specializations = { $in: [specialization] };
    }
    
    const students = await Student.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Student.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Get student by slug
const getStudentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const student = await Student.findOne({ slug });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle image uploads
    const imageUrl = req.files?.image?.[0]?.location || "";
    const coverImageUrl = req.files?.coverImage?.[0]?.location || "";
    
    // Parse JSON strings for arrays and objects
    const parseField = (field) => {
      if (typeof field === 'string' && field.trim()) {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.log(`Failed to parse field: ${field}`);
          return field;
        }
      }
      return field;
    };
    
    // Parse specific fields that might be JSON strings
    const parsedBody = {
      ...req.body,
      specializations: parseField(req.body.specializations),
      education: parseField(req.body.education),
      projects: parseField(req.body.projects),
      testimonials: parseField(req.body.testimonials),
      badges: parseField(req.body.badges),
      skills: parseField(req.body.skills),
      socialLinks: parseField(req.body.socialLinks),
      contact: parseField(req.body.contact)
    };
    
    const updateData = {
      ...parsedBody
    };
    
    // Only update image fields if new images are uploaded
    if (imageUrl) {
      updateData.image = imageUrl;
    }
    if (coverImageUrl) {
      updateData.coverImage = coverImageUrl;
    }
    
    console.log('Update data:', updateData);
    
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Student with this slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);
    
    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

// Get students by specialization
const getStudentsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const students = await Student.find({
      specializations: { $in: [specialization] }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students by specialization',
      error: error.message
    });
  }
};

// Get featured students (students with badges)
const getFeaturedStudents = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const students = await Student.find({
      badges: { $exists: true, $ne: [] }
    })
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured students',
      error: error.message
    });
  }
};

// Add testimonial to student
const addTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, text } = req.body;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    student.testimonials.push({ name, role, text });
    const updatedStudent = await student.save();
    
    res.status(200).json({
      success: true,
      message: 'Testimonial added successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding testimonial',
      error: error.message
    });
  }
};

// Add project to student
const addProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, year } = req.body;
    
    // Handle project image upload
    const projectImageUrl = req.files?.image?.[0]?.location || "";
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    student.projects.push({ 
      name, 
      description, 
      year, 
      image: projectImageUrl 
    });
    const updatedStudent = await student.save();
    
    res.status(200).json({
      success: true,
      message: 'Project added successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding project',
      error: error.message
    });
  }
};

// Add education to student
const addEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { degree, institution, year, achievement } = req.body;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    student.education.push({ degree, institution, year, achievement });
    const updatedStudent = await student.save();
    
    res.status(200).json({
      success: true,
      message: 'Education added successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding education',
      error: error.message
    });
  }
};

module.exports = {
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
}; 