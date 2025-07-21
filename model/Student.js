const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  year: String,
  achievement: String, // optional
}, { _id: false });

// const ProjectSchema = new mongoose.Schema({
//   name: String,
//   description: String,
//   year: String,
//   image: String,
// }, { _id: false });

const TestimonialSchema = new mongoose.Schema({
  name: String,
  role: String,
  text: String,
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // e.g. 'priya-sharma'
  name: { type: String, required: true },
  title: String,
  image: String,
  coverImage: String,
  badges: [String],
  location: String,
  email: String,
  phone: String,
  experience: String,
  bio: String,
  education: [EducationSchema],
  specializations: [String],
  // projects: [ProjectSchema],
  testimonials: [TestimonialSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema); 