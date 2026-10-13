const mongoose = require('mongoose');

// Define the schema for a Note document
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
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
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamps to documents
    timestamps: true,
  }
);

// Create the model from the schema
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
