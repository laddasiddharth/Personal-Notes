const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const authenticate = require('../middleware/auth');

const router = express.Router();

// 🔒 Apply JWT authentication middleware to ALL note routes
// This guarantees req.user is populated from the verified token
router.use(authenticate);

// ========================================================
// 1. GET /api/notes
// Retrieve notes belonging ONLY to the authenticated user
// ========================================================
router.get('/', async (req, res) => {
  try {
    // Derive user ID strictly from the verified JWT (req.user.id)
    const notes = await Note.find({ userId: req.user.id }).sort({
      pinned: -1, // Pinned notes first
      createdAt: -1, // Newest notes first
    });

    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

// ========================================================
// 2. POST /api/notes
// Create a note owned by the authenticated user
// ========================================================
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, pinned } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const newNote = new Note({
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      pinned: typeof pinned === 'boolean' ? pinned : false,
      userId: req.user.id, // Strictly derived from JWT
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note', details: err.message });
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
      if (!title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      note.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }
      note.content = content.trim();
    }

    if (tags !== undefined) {
      note.tags = Array.isArray(tags) ? tags : note.tags;
    }

    if (pinned !== undefined) {
      note.pinned = Boolean(pinned);
    }

    const updatedNote = await note.save();
    res.status(200).json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
});

module.exports = router;
