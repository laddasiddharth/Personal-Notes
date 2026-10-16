import { useState, useEffect, useCallback } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import './App.css';

// Base URL for the Express backend REST API (supports production deployment via VITE_API_URL)
const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = rawApiBase.replace(/\/+$/, '');
const API_URL = `${API_BASE}/api/notes`;

function App() {
  // ----------------------------------------------------
  // Notes & UI State
  // ----------------------------------------------------
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');

  // ----------------------------------------------------
  // Helper: Standardized Notes Sort Order (Pinned first, then Newest first)
  // ----------------------------------------------------
  const sortNotesList = (notesList) => {
    return [...notesList].sort((a, b) => {
      const aPinned = Boolean(a.pinned);
      const bPinned = Boolean(b.pinned);
      if (aPinned === bPinned) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return aPinned ? -1 : 1;
    });
  };

  // ----------------------------------------------------
  // 1. GET /api/notes: Fetch all notes from backend
  // ----------------------------------------------------
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(API_URL);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((data && data.error) || `Server error (${response.status})`);
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected data format received from server.');
      }

      setNotes(sortNotesList(data));
    } catch (err) {
      console.error('Fetch notes error:', err);
      setErrorMessage(err.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notes on initial load
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ----------------------------------------------------
  // 2. POST & PUT /api/notes: Create or Update Note
  // ----------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingNote) {
        // --- PUT /api/notes/:id (Update Note) ---
        const response = await fetch(`${API_URL}/${editingNote._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || `Failed to update note (${response.status})`);
        }

        const updatedNote = data;
        setNotes((prevNotes) => {
          const updated = prevNotes.map((n) =>
            n._id === updatedNote._id ? updatedNote : n
          );
          return sortNotesList(updated);
        });

        setEditingNote(null);
      } else {
        // --- POST /api/notes (Create Note) ---
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || `Failed to create note (${response.status})`);
        }

        const createdNote = data;
        setNotes((prevNotes) => sortNotesList([createdNote, ...prevNotes]));
      }
    } catch (err) {
      console.error('Save note error:', err);
      setErrorMessage(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // 3. DELETE /api/notes/:id: Delete Note
  // ----------------------------------------------------
  const handleDeleteNote = async (id) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((data && data.error) || `Failed to delete note (${response.status})`);
      }

      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));

      if (editingNote && editingNote._id === id) {
        setEditingNote(null);
      }
    } catch (err) {
      console.error('Delete note error:', err);
      setErrorMessage(err.message || 'Failed to delete note');
    }
  };

  // ----------------------------------------------------
  // 4. Quick Toggle Pin (PUT /api/notes/:id)
  // ----------------------------------------------------
  const handleTogglePin = async (note) => {
    try {
      const response = await fetch(`${API_URL}/${note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error((data && data.error) || `Failed to toggle pin (${response.status})`);
      }

      const updatedNote = data;
      setNotes((prevNotes) => {
        const updated = prevNotes.map((n) =>
          n._id === updatedNote._id ? updatedNote : n
        );
        return sortNotesList(updated);
      });
    } catch (err) {
      console.error('Pin toggle error:', err);
      setErrorMessage(err.message || 'Failed to toggle pin');
    }
  };

  // ----------------------------------------------------
  // Search & Filter (by title and tags)
  // ----------------------------------------------------
  const filteredNotes = notes.filter((note) => {
    const q = searchTitle.toLowerCase().trim();
    if (!q) return true;
    const titleMatches = note.title?.toLowerCase().includes(q);
    const tagMatches = note.tags?.some((t) => t.toLowerCase().includes(q));
    return titleMatches || tagMatches;
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <h1 className="main-title">Personal Notes App</h1>
        <p className="subtitle">
          Create, edit, delete, search, tag, and pin your personal notes.
        </p>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="alert-banner alert-error">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button className="btn-retry" onClick={fetchNotes}>
            Retry
          </button>
        </div>
      )}

      {/* Form to create/edit notes */}
      <section className="form-section">
        <NoteForm
          onSubmit={handleFormSubmit}
          editingNote={editingNote}
          onCancelEdit={() => setEditingNote(null)}
          isSubmitting={isSubmitting}
        />
      </section>

      {/* Search by Title/Tag & Toolbar */}
      <section className="dashboard-toolbar">
        <div className="toolbar-left">
          <h2 className="section-title">
            Your Notes <span className="notes-count">({notes.length})</span>
          </h2>
        </div>
        <div className="toolbar-right">
          <input
            type="text"
            className="search-input"
            placeholder="Search notes by title or tag..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </div>
      </section>

      {/* Notes List / States */}
      {isLoading ? (
        <div className="state-box">
          <div className="spinner"></div>
          <p className="state-text">Loading your notes from database...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="state-box empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="empty-title">You have no notes yet</h3>
          <p className="empty-subtitle">
            Write your first note in the form above!
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="state-box empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No notes found</h3>
          <p className="empty-subtitle">
            No notes match &quot;{searchTitle}&quot;.
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
