// client/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(''); // username OR email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/login`,
        { identifier, password },
        { withCredentials: true }
      );

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="chrome-card login-card">
        <h2 className="login-brandTitle">Ol&apos; Time Muscle</h2>

        <div className="login-brandWrap">
          <img
            className="login-brand"
            src={`${process.env.PUBLIC_URL}/brandMark.png`}
            alt="Brand Mark"
            onError={(e) => {
              // Fallback for weird deploy bases
              e.currentTarget.src = './brandMark.png';
            }}
          />
        </div>

        <h1 className="login-title">Login</h1>

        <form autoComplete="off" className="login-form" onSubmit={onSubmit}>
          <label className="login-label" htmlFor="identifier">
            Username or Email
          </label>
          <input
            id="identifier"
            className="login-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            inputMode="email"
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>

          <div className="password-field">
            <input
              id="password"
              className="login-input password-input"
              value={password}
              type={showPassword ? 'text' : 'password'}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={0}
            >
              <svg
                className="password-eye"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 5c-5.5 0-9.6 4.1-11 7 1.4 2.9 5.5 7 11 7s9.6-4.1 11-7c-1.4-2.9-5.5-7-11-7Zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                />
              </svg>
            </button>
          </div>

          {errorMsg ? <p className="field-error login-error">{errorMsg}</p> : null}

          <button disabled={isSubmitting} type="submit" className="chrome-btn login-btn">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
            Not registered yet? <Link to="/register">Signup</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
