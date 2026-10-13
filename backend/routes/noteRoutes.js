const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');

const router = express.Router();

// 💡 Test user ID to simulate note ownership until full authentication (Day 3)
const TEST_USER_ID = new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1');

// ==========================================
// 1. GET /api/notes
// Retrieve all notes belonging to the test user
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Find notes for the test user; pinned notes appear first, then newest first
    const notes = await Note.find({ userId: TEST_USER_ID }).sort({ pinned: -1, createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

// ==========================================
// 2. POST /api/notes
// Create a new note
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, pinned } = req.body;

    // Validation: Title and content are required
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
      userId: TEST_USER_ID, // Associate with test user
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note', details: err.message });
  }
});

// ==========================================
// 3. PUT /api/notes/:id
// Update an existing note by its ID
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation: Check if id is a valid 24-character hexadecimal ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Ownership check: Verify note belongs to test user
    if (note.userId && note.userId.toString() !== TEST_USER_ID.toString()) {
      return res.status(403).json({ error: 'Forbidden: You do not own this note' });
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

// ==========================================
// 4. DELETE /api/notes/:id
// Delete a note by its ID
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation: Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Ownership check: Verify note belongs to test user
    if (note.userId && note.userId.toString() !== TEST_USER_ID.toString()) {
      return res.status(403).json({ error: 'Forbidden: You do not own this note' });
    }

    await Note.findByIdAndDelete(id);
    res.status(200).json({ message: 'Note deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
});

module.exports = router;
