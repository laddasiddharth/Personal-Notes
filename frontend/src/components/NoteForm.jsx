import { useState, useEffect } from 'react';

// ========================================================
// NoteForm Component
// Props received from parent (App.jsx):
// - onSubmit: function to call when creating or updating
// - editingNote: note object being edited (or null for new)
// - onCancelEdit: function to cancel edit mode
// - isSubmitting: boolean indicating if save is in progress
// ========================================================
function NoteForm({ onSubmit, editingNote, onCancelEdit, isSubmitting }) {
  // Local state for the form inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [formError, setFormError] = useState('');

  // Whenever editingNote changes, update the form fields
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || '');
      setContent(editingNote.content || '');
      setTagsInput(editingNote.tags ? editingNote.tags.join(', ') : '');
      setPinned(editingNote.pinned || false);
      setFormError('');
    } else {
      // Reset form when not editing
      setTitle('');
      setContent('');
      setTagsInput('');
      setPinned(false);
      setFormError('');
    }
  }, [editingNote]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic frontend validation
    if (!title.trim()) {
      setFormError('Please enter a note title.');
      return;
    }
    if (!content.trim()) {
      setFormError('Please enter note content.');
      return;
    }

    if (title.trim().length > 200) {
      setFormError('Title cannot exceed 200 characters.');
      return;
    }
    if (content.trim().length > 20000) {
      setFormError('Content cannot exceed 20,000 characters.');
      return;
    }

    setFormError('');

    // Parse comma-separated tags into a deduplicated array of clean strings
    const rawTags = tagsInput
      .split(',')
      .map((t) => t.trim().slice(0, 50))
      .filter((t) => t.length > 0);
    const tagsArray = [...new Set(rawTags)].slice(0, 30);

    // Call parent handler with formatted data
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
      pinned,
    });

    // If creating a new note, clear form after submission
    if (!editingNote) {
      setTitle('');
      setContent('');
      setTagsInput('');
      setPinned(false);
    }
  };

  return (
    <form className="note-form-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3 className="form-title">
          {editingNote ? 'Edit Note' : 'Create a New Note'}
        </h3>
        {editingNote && (
          <button
            type="button"
            className="btn-text-cancel"
            onClick={onCancelEdit}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {formError && <div className="form-error-banner">{formError}</div>}

      <div className="form-group">
        <label htmlFor="note-title" className="form-label">
          Title <span className="required-star">*</span>
        </label>
        <input
          id="note-title"
          type="text"
          className="form-input"
          placeholder="e.g., Project meeting notes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="note-content" className="form-label">
          Content <span className="required-star">*</span>
        </label>
        <textarea
          id="note-content"
          className="form-textarea"
          rows="4"
          placeholder="Write your note details here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          maxLength={20000}
        />
      </div>

      <div className="form-group">
        <label htmlFor="note-tags" className="form-label">
          Tags <span className="form-hint">(comma separated)</span>
        </label>
        <input
          id="note-tags"
          type="text"
          className="form-input"
          placeholder="e.g., college, react, sem7"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-actions-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            disabled={isSubmitting}
          />
          <span>📌 Pin this note to top</span>
        </label>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : editingNote
            ? 'Update Note'
            : 'Save Note'}
        </button>
      </div>
    </form>
  );
}

export default NoteForm;
