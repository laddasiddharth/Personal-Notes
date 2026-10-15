const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔒 Apply JWT authentication middleware to ALL note routes
router.use(authenticate);

// Helper to sanitize and deduplicate tags
const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .filter((t) => typeof t === 'string')
    .map((t) => t.trim().slice(0, 50))
    .filter((t) => t.length > 0);
  return [...new Set(cleaned)].slice(0, 30);
};

// ========================================================
// 1. GET /api/notes
// Retrieve notes belonging ONLY to the authenticated user
// ========================================================
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({
      pinned: -1, // Pinned notes first
      createdAt: -1, // Newest notes first
    });

    res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({
      error: 'Failed to fetch notes',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

// ========================================================
// 2. POST /api/notes
// Create a note owned by the authenticated user
// ========================================================
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, pinned } = req.body;

    // Strict type and existence validation
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required and must be text' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
    }

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required and must be text' });
    }
    if (content.trim().length > 20000) {
      return res.status(400).json({ error: 'Content cannot exceed 20,000 characters' });
    }

    const newNote = new Note({
      title: title.trim(),
      content: content.trim(),
      tags: sanitizeTags(tags),
      pinned: typeof pinned === 'boolean' ? pinned : Boolean(pinned),
      userId: req.user.id, // Derived strictly from verified JWT
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({
      error: 'Failed to create note',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

// ========================================================
// 3. PUT /api/notes/:id
// Update an existing note (strictly verifying ownership)
// ========================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Ownership Verification: Ensure the note belongs to the user in the JWT
    if (!note.userId || note.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to edit this note.',
      });
    }

    const { title, content, tags, pinned } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty and must be text' });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
      }
      note.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty and must be text' });
      }
      if (content.trim().length > 20000) {
        return res.status(400).json({ error: 'Content cannot exceed 20,000 characters' });
      }
      note.content = content.trim();
    }

    if (tags !== undefined) {
      note.tags = sanitizeTags(tags);
    }

    if (pinned !== undefined) {
      note.pinned = Boolean(pinned);
    }

    const updatedNote = await note.save();
    res.status(200).json(updatedNote);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({
      error: 'Failed to update note',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

// ========================================================
// 4. DELETE /api/notes/:id
// Delete a note (strictly verifying ownership)
// ========================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Ownership Verification: Ensure the note belongs to the user in the JWT
    if (!note.userId || note.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this note.',
      });
    }

    await Note.findByIdAndDelete(id);
    res.status(200).json({ message: 'Note deleted successfully', id });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({
      error: 'Failed to delete note',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
    });
  }
});

module.exports = router;
