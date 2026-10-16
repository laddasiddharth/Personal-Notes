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
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Index to optimize query sorting: pinned notes first, then newest first
noteSchema.index({ pinned: -1, createdAt: -1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
