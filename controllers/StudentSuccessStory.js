const StudentSuccessStory = require('../model/StudentSuccessStory');

// Create a new student success story
exports.createStory = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.mediaUrl = req.file.location;
      if (req.file.mimetype.startsWith('image/')) data.mediaType = 'image';
      else if (req.file.mimetype.startsWith('video/')) data.mediaType = 'video';
      else data.mediaType = 'none';
    }
    const story = new StudentSuccessStory(data);
    await story.save();
    res.status(201).json(story);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all student success stories
exports.getAllStories = async (req, res) => {
  try {
    const stories = await StudentSuccessStory.find().sort({ order: 1, createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single story by ID
exports.getStoryById = async (req, res) => {
  try {
    const story = await StudentSuccessStory.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a story by ID
exports.updateStory = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.mediaUrl = req.file.location;
      if (req.file.mimetype.startsWith('image/')) data.mediaType = 'image';
      else if (req.file.mimetype.startsWith('video/')) data.mediaType = 'video';
      else data.mediaType = 'none';
    }
    const story = await StudentSuccessStory.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json(story);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a story by ID
exports.deleteStory = async (req, res) => {
  try {
    const story = await StudentSuccessStory.findByIdAndDelete(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 