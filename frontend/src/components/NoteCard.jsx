// ========================================================
// NoteCard Component
// Props received from parent (App.jsx):
// - note: object containing note fields (_id, title, content, tags, pinned, createdAt)
// - onEdit: function callback when user clicks Edit
// - onDelete: function callback when user clicks Delete
// - onTogglePin: function callback to toggle pinned status
// ========================================================
function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  // Format creation date into human-readable format
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const handleDelete = () => {
    // Beginner-friendly browser confirmation prompt before deletion
    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"?`);
    if (confirmed) {
      onDelete(note._id);
    }
  };

  return (
    <div className={`note-card ${note.pinned ? 'is-pinned' : ''}`}>
      <div className="note-card-top">
        <h4 className="note-card-title">{note.title}</h4>
        <button
          type="button"
          className={`pin-btn ${note.pinned ? 'pinned-active' : ''}`}
          title={note.pinned ? 'Unpin note' : 'Pin to top'}
          onClick={() => onTogglePin(note)}
        >
          {note.pinned ? '📌 Pinned' : '📍 Pin'}
        </button>
      </div>

      <p className="note-card-content">{note.content}</p>

      {/* Tags list */}
      {note.tags && note.tags.length > 0 && (
        <div className="note-tags-container">
          {note.tags.map((tag, index) => (
            <span key={index} className="note-tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer with date and action buttons */}
      <div className="note-card-footer">
        <span className="note-date">{formattedDate}</span>
        <div className="note-card-buttons">
          <button
            type="button"
            className="btn-action btn-edit"
            onClick={() => onEdit(note)}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="btn-action btn-delete"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteCard;
