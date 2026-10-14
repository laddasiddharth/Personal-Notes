import { useState } from 'react';

// ========================================================
// AuthForm Component
// Props:
// - onAuthSuccess: callback function receiving (token, user)
// ========================================================
function AuthForm({ onAuthSuccess }) {
  // 'login' or 'register' mode
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Basic frontend validation
    if (!isLoginMode && !name.trim()) {
      setAuthError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const endpoint = isLoginMode
      ? `${API_BASE}/api/auth/login`
      : `${API_BASE}/api/auth/register`;

    const payload = isLoginMode
      ? { email: email.trim(), password }
      : { name: name.trim(), email: email.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success: pass token and user info to parent
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${isLoginMode ? 'active' : ''}`}
          onClick={() => {
            setIsLoginMode(true);
            setAuthError('');
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${!isLoginMode ? 'active' : ''}`}
          onClick={() => {
            setIsLoginMode(false);
            setAuthError('');
          }}
        >
          Create Account
        </button>
      </div>

      <div className="auth-body">
        <h2 className="auth-title">
          {isLoginMode ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="auth-subtitle">
          {isLoginMode
            ? 'Sign in to access your private notes securely.'
            : 'Register to start creating and pinning your notes.'}
        </p>

        {authError && <div className="form-error-banner">{authError}</div>}

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name <span className="required-star">*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="e.g., Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="e.g., student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password <span className="required-star">*</span>{' '}
              <span className="form-hint">(min 6 characters)</span>
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : isLoginMode
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
