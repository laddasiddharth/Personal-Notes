import { useState, useEffect, useCallback } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import AuthForm from './components/AuthForm';
import './App.css';

// Base URL for the Express backend REST API (supports production deployment via VITE_API_URL)
const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = rawApiBase.replace(/\/+$/, '');
const API_URL = `${API_BASE}/api/notes`;

function App() {
  // ----------------------------------------------------
  // Authentication State (with try/catch against corrupted storage)
  // ----------------------------------------------------
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('notes_token') || '';
    } catch {
      return '';
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('notes_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
  // Handle Auth Success & Logout (Hoisted with useCallback)
  // ----------------------------------------------------
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setCurrentUser(newUser);
    try {
      localStorage.setItem('notes_token', newToken);
      localStorage.setItem('notes_user', JSON.stringify(newUser));
    } catch (err) {
      console.error('Storage write error:', err);
    }
  };

  const handleLogout = useCallback(() => {
    setToken('');
    setCurrentUser(null);
    setNotes([]);
    setEditingNote(null);
    try {
      localStorage.removeItem('notes_token');
      localStorage.removeItem('notes_user');
    } catch (err) {
      console.error('Storage clear error:', err);
    }
  }, []);

  // ----------------------------------------------------
  // Helper: Common Auth Headers
  // ----------------------------------------------------
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // ----------------------------------------------------
  // Fetch Request 1: GET /api/notes (Protected)
  // ----------------------------------------------------
  const fetchNotes = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Your session expired. Please sign in again.');
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((data && data.error) || `Server error (${response.status} ${response.statusText})`);
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
  }, [token, handleLogout]);

  // Fetch notes on initial login or mount
  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token, fetchNotes]);

  // ----------------------------------------------------
  // Fetch Request 2 & 3: POST & PUT /api/notes (Protected)
  // ----------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingNote) {
        // --- EDIT MODE (PUT) ---
        const response = await fetch(`${API_URL}/${editingNote._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });

        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please sign in again.');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || `Failed to update note (${response.status})`);
        }

        const updatedNote = data;

        // Update in state & maintain pinned sort order
        setNotes((prevNotes) => {
          const updated = prevNotes.map((n) =>
            n._id === updatedNote._id ? updatedNote : n
          );
          return sortNotesList(updated);
        });

        setEditingNote(null);
      } else {
        // --- CREATE MODE (POST) ---
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });

        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please sign in again.');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((data && data.error) || `Failed to create note (${response.status})`);
        }

        const createdNote = data;

        // Insert new note and sort immediately so it appears at top of its section
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
  // Fetch Request 4: DELETE /api/notes/:id (Protected)
  // ----------------------------------------------------
  const handleDeleteNote = async (id) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please sign in again.');
      }

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
  // Quick Toggle Pin (PUT /api/notes/:id)
  // ----------------------------------------------------
  const handleTogglePin = async (note) => {
    try {
      const response = await fetch(`${API_URL}/${note._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please sign in again.');
      }

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
  // Search by title (and tags)
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
        {/* <div className="badge-wrapper">
          <span className="badge-pulse"></span>
          <span>Day 4: JWT Authentication & Note Ownership</span>
        </div> */}
        <h1 className="main-title">Personal Notes App</h1>
        <p className="subtitle">
          Secure private notes protected with bcrypt password hashing and JWT authentication.
        </p>

        {/* User Status Bar when Logged In */}
        {currentUser && (
          <div className="user-bar">
            <div className="user-info">
              <span className="user-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="user-name">
                Logged in as <strong>{currentUser.name}</strong> ({currentUser.email})
              </span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
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

      {/* If NOT logged in: Show Auth Form */}
      {!currentUser ? (
        <div className="auth-wrapper">
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      ) : (
        /* If logged in: Show Notes Form & Dashboard */
        <>
          {/* Form to create/edit notes */}
          <section className="form-section">
            <NoteForm
              onSubmit={handleFormSubmit}
              editingNote={editingNote}
              onCancelEdit={() => setEditingNote(null)}
              isSubmitting={isSubmitting}
            />
          </section>

          {/* Search by Title & Toolbar */}
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
                Write your first note in the form above! Only you can see and manage your notes.
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
        </>
      )}
    </div>
  );
}

export default App;
