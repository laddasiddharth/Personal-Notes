import { useState } from 'react';
import './App.css';

function App() {
  const [serverStatus, setServerStatus] = useState('idle'); // 'idle' | 'checking' | 'connected' | 'error'
  const [dbStatus, setDbStatus] = useState('unknown');
  const [apiResponse, setApiResponse] = useState(null);

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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="badge-wrapper">
          <span className="badge-pulse"></span>
          <span>Day 1: Project Setup & Architecture</span>
        </div>
        <h1 className="main-title">Personal Notes App</h1>
        <p className="subtitle">
          Built with React, Node.js, Express.js, and MongoDB with Mongoose.
        </p>
      </header>

      {/* Grid: Status Verification & Mongoose Schema */}
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

        {/* Note Model Schema Card */}
        <section className="card">
          <div className="card-title-row">
            <h2 className="card-title">📝 Note Model Schema</h2>
            <span className="status-chip success">Mongoose Ready</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Defined in <code>backend/models/Note.js</code> with timestamps.
          </p>

          <table className="schema-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Constraint</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="field-name">title</td>
                <td className="field-type">String</td>
                <td>Required, Trimmed</td>
              </tr>
              <tr>
                <td className="field-name">content</td>
                <td className="field-type">String</td>
                <td>Required</td>
              </tr>
              <tr>
                <td className="field-name">tags</td>
                <td className="field-type">Array&lt;String&gt;</td>
                <td>Default: []</td>
              </tr>
              <tr>
                <td className="field-name">pinned</td>
                <td className="field-type">Boolean</td>
                <td>Default: false</td>
              </tr>
              <tr>
                <td className="field-name">userId</td>
                <td className="field-type">ObjectId (ref: User)</td>
                <td>Owner Reference</td>
              </tr>
              <tr>
                <td className="field-name">createdAt / updatedAt</td>
                <td className="field-type">Date</td>
                <td>Automatic Timestamps</td>
              </tr>
            </tbody>
          </table>
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
