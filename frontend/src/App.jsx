import { useState } from 'react';
import './App.css';

function App() {
  const [serverStatus, setServerStatus] = useState('idle'); // 'idle' | 'checking' | 'connected' | 'error'
  const [dbStatus, setDbStatus] = useState('unknown');
  const [apiResponse, setApiResponse] = useState(null);
  const [notesList, setNotesList] = useState(null);

  const checkBackendConnection = async () => {
    setServerStatus('checking');
    try {
      const response = await fetch('http://localhost:5000/');
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setServerStatus('connected');
      setDbStatus(data.databaseStatus || 'Connected');
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setServerStatus('error');
      setDbStatus('offline');
      setApiResponse(`Could not reach backend at http://localhost:5000.\nDetails: ${err.message}`);
    }
  };

  const testFetchNotes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notes');
      const data = await response.json();
      setNotesList(JSON.stringify(data, null, 2));
    } catch (err) {
      setNotesList(`Error calling GET /api/notes: ${err.message}`);
    }
  };

  const testCreateNote = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My First Test Note',
          content: 'Created via Day 2 REST API endpoint test!',
          tags: ['test', 'day2'],
          pinned: true,
        }),
      });
      const data = await response.json();
      setNotesList(JSON.stringify(data, null, 2));
    } catch (err) {
      setNotesList(`Error calling POST /api/notes: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="badge-wrapper">
          <span className="badge-pulse"></span>
          <span>Day 2: Express REST APIs & MongoDB</span>
        </div>
        <h1 className="main-title">Personal Notes App</h1>
        <p className="subtitle">
          Built with React, Node.js, Express.js, and MongoDB with Mongoose.
        </p>
      </header>

      {/* Grid: Diagnostics & REST APIs */}
      <div className="dashboard-grid">
        {/* Verification Card */}
        <section className="card">
          <div className="card-title-row">
            <h2 className="card-title">🔌 Connection Diagnostics</h2>
            <span className="status-chip neutral">Live Monitor</span>
          </div>
          <div className="status-list">
            <div className="status-item">
              <span className="status-label">
                <span>💻</span> Frontend (React + Vite)
              </span>
              <span className="status-chip success">● Running</span>
            </div>

            <div className="status-item">
              <span className="status-label">
                <span>⚡</span> Express Backend (Port 5000)
              </span>
              {serverStatus === 'idle' && (
                <span className="status-chip neutral">Ready to test</span>
              )}
              {serverStatus === 'checking' && (
                <span className="status-chip warning">Connecting...</span>
              )}
              {serverStatus === 'connected' && (
                <span className="status-chip success">● Online</span>
              )}
              {serverStatus === 'error' && (
                <span className="status-chip danger">● Offline</span>
              )}
            </div>

            <div className="status-item">
              <span className="status-label">
                <span>🍃</span> MongoDB Database
              </span>
              {dbStatus === 'unknown' && (
                <span className="status-chip neutral">Untested</span>
              )}
              {dbStatus === 'Connected' && (
                <span className="status-chip success">● Connected</span>
              )}
              {dbStatus === 'Disconnected' && (
                <span className="status-chip warning">▲ Disconnected</span>
              )}
              {dbStatus === 'offline' && (
                <span className="status-chip danger">● Offline</span>
              )}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={checkBackendConnection}
            disabled={serverStatus === 'checking'}
          >
            {serverStatus === 'checking' ? 'Pinging Server...' : 'Test Backend & DB Connection'}
          </button>

          {apiResponse && (
            <div className="response-box">
              <code>{apiResponse}</code>
            </div>
          )}
        </section>

        {/* REST API Endpoints Card */}
        <section className="card">
          <div className="card-title-row">
            <h2 className="card-title">📡 Day 2 REST APIs</h2>
            <span className="status-chip success">Active</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Routes mounted on <code>/api/notes</code> with test user ownership.
          </p>

          <table className="schema-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#60a5fa', fontWeight: 'bold' }}>GET</td>
                <td><code>/api/notes</code></td>
                <td>Retrieve all user notes</td>
              </tr>
              <tr>
                <td style={{ color: '#34d399', fontWeight: 'bold' }}>POST</td>
                <td><code>/api/notes</code></td>
                <td>Create a new note</td>
              </tr>
              <tr>
                <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>PUT</td>
                <td><code>/api/notes/:id</code></td>
                <td>Update an existing note</td>
              </tr>
              <tr>
                <td style={{ color: '#f87171', fontWeight: 'bold' }}>DELETE</td>
                <td><code>/api/notes/:id</code></td>
                <td>Delete note by ID</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className="btn-primary" style={{ fontSize: '12px', padding: '8px' }} onClick={testFetchNotes}>
              Test GET /api/notes
            </button>
            <button className="btn-primary" style={{ fontSize: '12px', padding: '8px', background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={testCreateNote}>
              Test POST /api/notes
            </button>
          </div>

          {notesList && (
            <div className="response-box">
              <code>{notesList}</code>
            </div>
          )}
        </section>
      </div>

      {/* Quick Launch Commands Card */}
      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">🚀 Quick Start Commands</h2>
          <span className="status-chip neutral">Terminal Guide</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Run the backend and frontend in two separate terminal windows:
        </p>

        <div className="dashboard-grid" style={{ marginTop: '16px', marginBottom: 0 }}>
          <div className="cmd-box">
            <div className="cmd-label">Backend (Express & MongoDB)</div>
            <div className="cmd-line">
              <span className="cmd-prompt">&gt;</span> cd backend
            </div>
            <div className="cmd-line" style={{ marginTop: '4px' }}>
              <span className="cmd-prompt">&gt;</span> npm run dev
            </div>
          </div>

          <div className="cmd-box">
            <div className="cmd-label">Frontend (React & Vite)</div>
            <div className="cmd-line">
              <span className="cmd-prompt">&gt;</span> cd frontend
            </div>
            <div className="cmd-line" style={{ marginTop: '4px' }}>
              <span className="cmd-prompt">&gt;</span> npm run dev
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
