const mongoose = require('mongoose');

// Define the schema for a Note document
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [20000, 'Content cannot exceed 20,000 characters'],
    },
    tags: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note owner userId is required'],
      index: true,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamps to documents
    timestamps: true,
  }
);

// Compound index to optimize the query: Note.find({ userId }).sort({ pinned: -1, createdAt: -1 })
noteSchema.index({ userId: 1, pinned: -1, createdAt: -1 });

// Create the model from the schema
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
