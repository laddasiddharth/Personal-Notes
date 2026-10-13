import { useState, useEffect } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import './App.css';

// Base URL for the Express backend REST API
const API_URL = 'http://localhost:5000/api/notes';

function App() {
  // ----------------------------------------------------
  // React State Management
  // ----------------------------------------------------
  // 1. notes: Array holding our list of notes from MongoDB
  const [notes, setNotes] = useState([]);

  // 2. isLoading: Boolean to show a loading message/spinner
  const [isLoading, setIsLoading] = useState(true);

  // 3. errorMessage: String to show any server or network error
  const [errorMessage, setErrorMessage] = useState('');

  // 4. editingNote: The note currently being edited (null when creating)
  const [editingNote, setEditingNote] = useState(null);

  // 5. isSubmitting: Boolean to disable buttons while saving
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 6. searchQuery: String to filter notes by title, content, or tag
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // Fetch Request 1: GET /api/notes (Retrieve notes on page load)
  // ----------------------------------------------------
  const fetchNotes = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Fetch notes error:', err);
      setErrorMessage(
        'Could not load notes. Please check that your Express server and MongoDB are running on http://localhost:5000.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetchNotes once when the component first mounts
  useEffect(() => {
    fetchNotes();
  }, []);

  // ----------------------------------------------------
  // Fetch Request 2 & 3: POST /api/notes and PUT /api/notes/:id
  // ----------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingNote) {
        // --- EDIT MODE (PUT) ---
        const response = await fetch(`${API_URL}/${editingNote._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update note');
        }

        const updatedNote = await response.json();

        // Update the note in local state
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n))
        );

        // Exit edit mode
        setEditingNote(null);
      } else {
        // --- CREATE MODE (POST) ---
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create note');
        }

        const createdNote = await response.json();

        // Add the newly created note to local state (pinned notes at top)
        setNotes((prevNotes) => {
          if (createdNote.pinned) {
            return [createdNote, ...prevNotes];
          }
          return [...prevNotes, createdNote];
        });
      }
    } catch (err) {
      console.error('Save note error:', err);
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Fetch Request 4: DELETE /api/notes/:id
  // ----------------------------------------------------
  const handleDeleteNote = async (id) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      // Remove the deleted note from local state
      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));

      // If the deleted note was currently in edit mode, cancel edit mode
      if (editingNote && editingNote._id === id) {
        setEditingNote(null);
      }
    } catch (err) {
      console.error('Delete note error:', err);
      setErrorMessage(err.message);
    }
  };

  // ----------------------------------------------------
  // Quick Toggle Pin (PUT /api/notes/:id)
  // ----------------------------------------------------
  const handleTogglePin = async (note) => {
    try {
      const response = await fetch(`${API_URL}/${note._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle pin');
      }

      const updatedNote = await response.json();

      // Update state and keep pinned notes sorted at top
      setNotes((prevNotes) => {
        const updated = prevNotes.map((n) =>
          n._id === updatedNote._id ? updatedNote : n
        );
        return updated.sort((a, b) => {
          if (a.pinned === b.pinned) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.pinned ? -1 : 1;
        });
      });
    } catch (err) {
      console.error('Pin toggle error:', err);
      setErrorMessage(err.message);
    }
  };

  // ----------------------------------------------------
  // Filter notes by search query
  // ----------------------------------------------------
  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(q);
    const contentMatch = note.content?.toLowerCase().includes(q);
    const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="badge-wrapper">
          <span className="badge-pulse"></span>
          <span>Personal Notes App • Day 3 Dashboard</span>
        </div>
        <h1 className="main-title">Notes Dashboard</h1>
        <p className="subtitle">
          Manage, pin, and organize your daily notes with real-time Express & MongoDB sync.
        </p>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="alert-banner alert-error">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            className="btn-retry"
            onClick={() => {
              setErrorMessage('');
              fetchNotes();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Form Section */}
      <section className="form-section">
        <NoteForm
          onSubmit={handleFormSubmit}
          editingNote={editingNote}
          onCancelEdit={() => setEditingNote(null)}
          isSubmitting={isSubmitting}
        />
      </section>

      {/* Notes Dashboard Toolbar */}
      <section className="dashboard-toolbar">
        <div className="toolbar-left">
          <h2 className="section-title">
            All Notes <span className="notes-count">({notes.length})</span>
          </h2>
        </div>
        <div className="toolbar-right">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search notes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Notes Content State: Loading, Empty, or Cards Grid */}
      {isLoading ? (
        <div className="state-box">
          <div className="spinner"></div>
          <p className="state-text">Loading your notes from database...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="state-box empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">No notes found</h3>
          <p className="empty-subtitle">
            Create your first note using the form above to get started!
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="state-box empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No matching notes</h3>
          <p className="empty-subtitle">
            No notes matched &quot;{searchQuery}&quot;. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={(noteToEdit) => {
                setEditingNote(noteToEdit);
                // Smooth scroll up to form
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleDeleteNote}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
