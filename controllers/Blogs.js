const Blog = require("../model/Blogs.js");
const slugify = require("slugify");

// Create blog
const createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      author,
      publishDate,
      metaTitle,
      metaDescription,
      status,
    } = req.body;

    const slug = slugify(title, { lower: true });
    // S3 returns location in req.file.location
    const imageUrl = req.file?.location || "";

    const blog = new Blog({
      title,
      slug,
      excerpt,
      content,
      category,
      tags: tags?.split(",").map((t) => t.trim()),
      author,
      publishDate,
      metaTitle,
      metaDescription,
      status,
      imageUrl,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: err.message });
  }
};
const getBlogBySlug = async (req, res) => {
  try {
    const blogSlug = req.params.slug;
    const blog = await Blog.findOne({ slug: blogSlug }); // Use findOne with the slug

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res
      .status(500)
      .json({
        message: "Server error while fetching blog post",
        error: error.message,
      });
  }
};

// Get all blogs
const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findByIdAndDelete(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }
    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (err) {
    console.error("Error in deleteBlog:", err);
    if (err.kind === 'ObjectId') { // Handle invalid ObjectId format
        return res.status(400).json({ error: "Invalid blog post ID format." });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      author,
      publishDate,
      metaTitle,
      metaDescription,
      status,
    } = req.body;

    // If title is updated, update slug
    if (title && title !== existingBlog.title) {
      existingBlog.slug = slugify(title, { lower: true });
      existingBlog.title = title;
    }
    if (excerpt !== undefined) existingBlog.excerpt = excerpt;
    if (content !== undefined) existingBlog.content = content;
    if (category !== undefined) existingBlog.category = category;
    if (tags !== undefined) {
      existingBlog.tags = tags.split(",").map((t) => t.trim());
    }
    if (author !== undefined) existingBlog.author = author;
    if (publishDate !== undefined) existingBlog.publishDate = publishDate;
    if (metaTitle !== undefined) existingBlog.metaTitle = metaTitle;
    if (metaDescription !== undefined) existingBlog.metaDescription = metaDescription;
    if (status !== undefined) existingBlog.status = status;

    // If a new image is uploaded, update imageUrl
    if (req.file?.location) {
      existingBlog.imageUrl = req.file.location;
    }

    await existingBlog.save();
    res.status(200).json(existingBlog);
  } catch (err) {
    console.error("Error updating blog:", err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid blog post ID format." });
    }
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createBlog,
  getBlogs,
  getBlogBySlug,
  deleteBlog,
  updateBlog
};
