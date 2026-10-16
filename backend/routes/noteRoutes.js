const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');

const router = express.Router();

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
// Retrieve all notes (pinned first, then newest first)
// ========================================================
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({
      pinned: -1,
      createdAt: -1,
    });
    res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ========================================================
// 2. POST /api/notes
// Create a new note
// ========================================================
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, pinned } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
    }

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (content.trim().length > 20000) {
      return res.status(400).json({ error: 'Content cannot exceed 20,000 characters' });
    }

    const newNote = new Note({
      title: title.trim(),
      content: content.trim(),
      tags: sanitizeTags(tags),
      pinned: typeof pinned === 'boolean' ? pinned : Boolean(pinned),
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// ========================================================
// 3. PUT /api/notes/:id
// Update an existing note by ID
// ========================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { title, content, tags, pinned } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
      }
      note.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
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
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// ========================================================
// 4. DELETE /api/notes/:id
// Delete a note by ID
// ========================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Note ID format' });
    }

    const note = await Note.findByIdAndDelete(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully', id });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
