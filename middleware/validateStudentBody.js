const validateStudentBody = (req, res, next) => {
  const { name, slug } = req.body;
  
  // Check required fields
  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      message: 'Name and slug are required fields'
    });
  }
  
  // Validate slug format (only lowercase letters, numbers, and hyphens)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return res.status(400).json({
      success: false,
      message: 'Slug must contain only lowercase letters, numbers, and hyphens'
    });
  }
  
  // Validate email format if provided
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
  }
  
  // Validate phone format if provided
  if (req.body.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(req.body.phone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }
  }
  
  next();
};

const validateTestimonialBody = (req, res, next) => {
  const { name, role, text } = req.body;
  
  if (!name || !role || !text) {
    return res.status(400).json({
      success: false,
      message: 'Name, role, and text are required for testimonials'
    });
  }
  
  if (text.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Testimonial text must be at least 10 characters long'
    });
  }
  
  next();
};

const validateProjectBody = (req, res, next) => {
  const { name, description, year } = req.body;
  
  if (!name || !description || !year) {
    return res.status(400).json({
      success: false,
      message: 'Name, description, and year are required for projects'
    });
  }
  
  // Validate year format
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(year)) {
    return res.status(400).json({
      success: false,
      message: 'Year must be a 4-digit number'
    });
  }
  
  next();
};

const validateEducationBody = (req, res, next) => {
  const { degree, institution, year } = req.body;
  
  if (!degree || !institution || !year) {
    return res.status(400).json({
      success: false,
      message: 'Degree, institution, and year are required for education'
    });
  }
  
  // Validate year format
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(year)) {
    return res.status(400).json({
      success: false,
      message: 'Year must be a 4-digit number'
    });
  }
  
  next();
};

module.exports = {
  validateStudentBody,
  validateTestimonialBody,
  validateProjectBody,
  validateEducationBody
}; 